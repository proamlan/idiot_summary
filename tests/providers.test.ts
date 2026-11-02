import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NvidiaProvider } from '../src/providers/nvidia-provider';
import { OpenRouterProvider } from '../src/providers/openrouter-provider';
import { AuthError } from '../src/shared/errors';
import { ArticleContent } from '../src/shared/types';

const mockArticle: ArticleContent = {
  url: 'https://example.com/quantum',
  title: 'Quantum Computing Explained',
  cleanedText: 'Quantum computers use qubits instead of classic bits to perform calculations.',
  markdown: '# Quantum Computing Explained\n\nQuantum computers use qubits instead of classic bits to perform calculations.',
  characterCount: 95,
  estimatedWordCount: 12,
  estimatedTokenCount: 25,
  extractedAt: new Date().toISOString(),
};

const validSummaryJson = JSON.stringify({
  page_type: 'Science Article',
  title: 'Quantum Computing Explained Simply',
  big_idea: 'Quantum computers use quantum physics to calculate certain problems much faster.',
  simple_explanation: 'Imagine flipping a coin. While spinning in the air, it is neither just heads nor tails.',
  key_points: [
    { point: 'Qubits vs Bits', explanation: 'Bits are 0 or 1, qubits can be both at once.' },
  ],
  why_it_matters: 'Could unlock breakthrough medicines and materials.',
  real_world_example: 'Like exploring every maze path at once instead of one by one.',
  important_numbers: [
    { value: '1,000x', context: 'Potential speedup for specific simulations' },
  ],
  difficult_terms: [
    { term: 'Superposition', simple_definition: 'Being in multiple states at once', example: 'A spinning coin' },
  ],
  claims_and_caveats: [
    { claim: 'Quantum computers will replace laptops', type: 'opinion', caveat: 'Unlikely, specialized machines only' },
  ],
  bottom_line: 'Quantum computers are specialized powerhouses for complex puzzles, not daily email.',
});

describe('AI Provider Integrations', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('7. NVIDIA Provider successfully executes summarization with valid mock response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          { message: { content: validSummaryJson } },
        ],
      }),
    } as any);

    const provider = new NvidiaProvider(() => 'nvapi-valid-test-key');
    const summary = await provider.summarize({
      article: mockArticle,
      mode: 'eli12',
    });

    expect(summary.big_idea).toContain('Quantum computers use quantum physics');
    expect(summary.key_points).toHaveLength(1);
    expect(summary.bottom_line).toContain('daily email');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('8. OpenRouter Provider successfully executes summarization', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          { message: { content: validSummaryJson } },
        ],
      }),
    } as any);

    const provider = new OpenRouterProvider(() => 'sk-or-v1-valid-test-key');
    const summary = await provider.summarize({
      article: mockArticle,
      mode: 'ultra-simple',
    });

    expect(summary.title).toBe('Quantum Computing Explained Simply');
    expect(summary.important_numbers[0].value).toBe('1,000x');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('10. Invalid API key returns AuthError without repeated retry loops', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized: Invalid API Key',
    } as any);

    const provider = new NvidiaProvider(() => 'nvapi-invalid-key');
    await expect(
      provider.summarize({ article: mockArticle, mode: 'eli12' })
    ).rejects.toThrow(AuthError);

    // Auth failures should NOT be retried (called exactly 1 time)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('11. Rate limit (429) triggers exponential backoff and retries', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        return {
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: validSummaryJson } }],
        }),
      };
    });

    const provider = new NvidiaProvider(() => 'nvapi-key');
    const summary = await provider.summarize({ article: mockArticle, mode: 'eli12' });

    expect(summary).toBeDefined();
    expect(callCount).toBe(2); // Retried once and succeeded!
  });

  it('Health check returns ok: true when model responds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'OK' } }],
      }),
    } as any);

    const provider = new OpenRouterProvider(() => 'sk-or-key');
    const status = await provider.healthCheck();

    expect(status.ok).toBe(true);
    expect(status.message).toContain('successful');
  });
});
