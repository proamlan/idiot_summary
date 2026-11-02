import { HistoryItem, StructuredSummary, ExplanationMode, AIProviderType } from '../shared/types';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../shared/constants';
import { extractDomain } from '../shared/utils';

const memoryStore: Record<string, any> = {};

function getStorageArea() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: (keys: string) => chrome.storage.local.get(keys),
      set: (items: Record<string, any>) => chrome.storage.local.set(items),
      remove: (keys: string) => chrome.storage.local.remove(keys),
    };
  }
  return {
    get: async (key: string) => ({ [key]: memoryStore[key] }),
    set: async (items: Record<string, any>) => { Object.assign(memoryStore, items); },
    remove: async (key: string) => { delete memoryStore[key]; },
  };
}

export async function getHistory(): Promise<HistoryItem[]> {
  const store = getStorageArea();
  const res = await store.get(STORAGE_KEYS.HISTORY);
  return (res && res[STORAGE_KEYS.HISTORY]) || [];
}

export async function saveHistoryItem(item: {
  url: string;
  title: string;
  summary: StructuredSummary;
  mode: ExplanationMode;
  provider: AIProviderType;
  model: string;
}): Promise<HistoryItem> {
  const store = getStorageArea();
  const current = await getHistory();

  const historyItem: HistoryItem = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url: item.url,
    domain: extractDomain(item.url),
    title: item.title || item.summary.title || 'Untitled',
    bigIdea: item.summary.big_idea,
    bottomLine: item.summary.bottom_line,
    mode: item.mode,
    provider: item.provider,
    model: item.model,
    createdAt: new Date().toISOString(),
    summary: item.summary,
  };

  // Prepend newest item, limit to MAX_HISTORY_ITEMS
  const updated = [historyItem, ...current.filter((i) => i.url !== item.url)].slice(0, MAX_HISTORY_ITEMS);
  await store.set({ [STORAGE_KEYS.HISTORY]: updated });
  return historyItem;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const store = getStorageArea();
  const current = await getHistory();
  const updated = current.filter((item) => item.id !== id);
  await store.set({ [STORAGE_KEYS.HISTORY]: updated });
}

export async function clearHistory(): Promise<void> {
  const store = getStorageArea();
  await store.remove(STORAGE_KEYS.HISTORY);
}
