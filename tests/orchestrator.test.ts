import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { orchestrator } from '../src/background/ai-orchestrator';
import { saveSettings } from '../src/storage/settings-storage';
import { DEFAULT_NVIDIA_MODEL } from '../src/shared/constants';
import { ArticleContent } from '../src/shared/types';

const mockArticle: ArticleContent = {
  url: 'https://example.com/ai-agents',
  title: 'Understanding AI Agents',
  cleanedText: 'Autonomous AI agents combine LLMs with planning, memory, and tool execution to solve workflows.',
  markdown: '# Understanding AI Agents\n\nAutonomous AI agents combine LLMs with planning, memory, and tool execution to solve workflows.',
  characterCount: 110,
  estimatedWordCount: 15,
  estimatedTokenCount: 28,
  extractedAt: new Date().toISOString(),
};

const validSummaryJson = JSON.stringify({
  page_type: 'Tech Article',
  title: 'AI Agents Explained',
  big_idea: 'AI agents are software programs that can take actions to achieve a goal, not just answer questions.',
  simple_explanation: 'Instead of just giving you a recipe, an AI agent goes to the store, buys ingredients, and bakes the cake.',
  key_points: [
    { point: 'Perception and Action', explanation: 'Agents observe their environment and choose steps to reach goals.' },
  ],
  why_it_matters: 'Automates multi-step tedious tasks.',
  real_world_example: 'Like having an assistant book flights, hotel, and dinner without asking at each step.',
  important_numbers: [],
  difficult_terms: [
    { term: 'Autonomous', simple_definition: 'Able to act independently without step-by-step human orders', example: 'A robot vacuum' },
  ],
  claims_and_caveats: [],
  bottom_line: 'Agents move AI from passive chatbots to active digital co-workers.',
});

describe('AI Orchestrator & Fallback Mechanism', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await saveSettings({
      nvidiaApiKey: 'nvapi-key-test',
      openrouterApiKey: 'sk-or-key-test',
      primaryProvider: 'nvidia',
      primaryModel: DEFAULT_NVIDIA_MODEL,
      fallbackProvider: 'openrouter',
      fallbackModel: 'openrouter/free',
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('9. Automatically falls back to OpenRouter when NVIDIA primary provider fails', async () => {
    // NVIDIA call fails with 500, then OpenRouter call succeeds with 200
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('nvidia.com')) {
        return {
          ok: false,
          status: 500,
          text: async () => 'NVIDIA NIM Temporary Service Unavailable',
        };
      }
      if (url.includes('openrouter.ai')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: validSummaryJson } }],
          }),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await orchestrator.summarizeArticle(mockArticle, 'eli12', true);

    expect(result.fallbackTriggered).toBe(true);
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('openrouter/free');
    expect(result.originalModel).toBe(DEFAULT_NVIDIA_MODEL);
    expect(result.summary.big_idea).toContain('AI agents are software programs');
  });

  it('Deduplicates concurrent in-flight requests for the same article', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: validSummaryJson } }],
        }),
      };
    });

    const uniqueArticle = { ...mockArticle, url: 'https://example.com/unique-test' };
    const [res1, res2] = await Promise.all([
      orchestrator.summarizeArticle(uniqueArticle, 'eli12', true),
      orchestrator.summarizeArticle(uniqueArticle, 'eli12', true),
    ]);

    expect(res1.summary.title).toBe(res2.summary.title);
    expect(callCount).toBe(1); // Deduped to a single API call!
  });
});
