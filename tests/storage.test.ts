import { describe, it, expect } from 'vitest';
import { getSettings, saveSettings, clearApiKeys } from '../src/storage/settings-storage';
import { getHistory, saveHistoryItem, deleteHistoryItem, clearHistory } from '../src/storage/history-storage';
import { computeCacheKey, getCachedSummary, setCachedSummary } from '../src/storage/cache-storage';
import { StructuredSummary, SummaryResult } from '../src/shared/types';

const sampleSummary: StructuredSummary = {
  page_type: 'Article',
  title: 'Storage Test',
  big_idea: 'Testing storage persistence in Chrome Extension.',
  simple_explanation: 'We verify that local data stays intact.',
  key_points: [],
  why_it_matters: 'Settings must persist.',
  real_world_example: 'Like writing notes in a physical ledger.',
  important_numbers: [],
  difficult_terms: [],
  claims_and_caveats: [],
  bottom_line: 'Storage operates reliably.',
};

describe('Chrome Storage Layer', () => {
  it('15. Stores and updates extension settings accurately', async () => {
    const updated = await saveSettings({
      nvidiaApiKey: 'nvapi-custom-storage-key',
      primaryModel: 'custom-model-id',
      defaultMode: 'ultra-simple',
    });

    expect(updated.nvidiaApiKey).toBe('nvapi-custom-storage-key');
    expect(updated.defaultMode).toBe('ultra-simple');

    const retrieved = await getSettings();
    expect(retrieved.nvidiaApiKey).toBe('nvapi-custom-storage-key');
    expect(retrieved.primaryModel).toBe('custom-model-id');
  });

  it('Clears API keys safely without corrupting other settings', async () => {
    await saveSettings({
      nvidiaApiKey: 'nvapi-key-to-clear',
      openrouterApiKey: 'sk-or-key-to-clear',
      defaultMode: 'deep',
    });

    await clearApiKeys();
    const current = await getSettings();

    expect(current.nvidiaApiKey).toBe('');
    expect(current.openrouterApiKey).toBe('');
    expect(current.defaultMode).toBe('deep'); // Preserved!
  });

  it('Saves, queries, and deletes reading history items', async () => {
    await clearHistory();
    const saved = await saveHistoryItem({
      url: 'https://example.com/item1',
      title: 'Item 1 Title',
      summary: sampleSummary,
      mode: 'eli12',
      provider: 'nvidia',
      model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    });

    let history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].url).toBe('https://example.com/item1');
    expect(history[0].bigIdea).toBe(sampleSummary.big_idea);

    await deleteHistoryItem(saved.id);
    history = await getHistory();
    expect(history).toHaveLength(0);
  });

  it('Caches and retrieves summaries by hash key', async () => {
    const key = computeCacheKey('https://example.com/cache', 'fp123', 'eli12', 'model-1');
    const mockResult: SummaryResult = {
      summary: sampleSummary,
      mode: 'eli12',
      provider: 'nvidia',
      model: 'model-1',
      fallbackTriggered: false,
      cached: false,
      createdAt: new Date().toISOString(),
      url: 'https://example.com/cache',
      title: 'Cache Test',
      domain: 'example.com',
    };

    await setCachedSummary(key, mockResult);
    const cached = await getCachedSummary(key);

    expect(cached).not.toBeNull();
    expect(cached?.title).toBe('Cache Test');
    expect(cached?.summary.big_idea).toBe(sampleSummary.big_idea);
  });
});
