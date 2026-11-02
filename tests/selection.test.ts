import { describe, it, expect, vi } from 'vitest';
import { orchestrator } from '../src/background/ai-orchestrator';
import { saveSettings } from '../src/storage/settings-storage';
import { DEFAULT_NVIDIA_MODEL } from '../src/shared/constants';

describe('Selected-Text Explanation Flow', () => {
  it('16. Successfully triggers explanation for selected paragraph with context', async () => {
    await saveSettings({
      nvidiaApiKey: 'nvapi-key',
      primaryProvider: 'nvidia',
      primaryModel: DEFAULT_NVIDIA_MODEL,
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This paragraph explains that photosynthesis is how plants turn sunlight into food sugar, releasing oxygen into the air.',
            },
          },
        ],
      }),
    } as any);

    const result = await orchestrator.explainSelection(
      'Plants utilize chlorophyll pigments to absorb photons and synthesize glucose via the Calvin cycle.',
      'Biology Chapter 4: Energetics in Plant Cells'
    );

    expect(result.selectedText).toContain('Plants utilize chlorophyll');
    expect(result.explanation).toContain('photosynthesis is how plants turn sunlight into food sugar');
    expect(result.provider).toBe('nvidia');
  });
});
