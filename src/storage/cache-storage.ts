import { SummaryResult } from '../shared/types';
import { STORAGE_KEYS } from '../shared/constants';
import { hashString } from '../shared/utils';

const memoryStore: Record<string, any> = {};

function getStorageArea() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: (keys: string | string[]) => chrome.storage.local.get(keys),
      set: (items: Record<string, any>) => chrome.storage.local.set(items),
      remove: (keys: string | string[]) => chrome.storage.local.remove(keys),
    };
  }
  return {
    get: async (keys: string | string[]) => {
      const res: Record<string, any> = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) {
        if (k in memoryStore) res[k] = memoryStore[k];
      }
      return res;
    },
    set: async (items: Record<string, any>) => { Object.assign(memoryStore, items); },
    remove: async (keys: string | string[]) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) delete memoryStore[k];
    },
  };
}

export function computeCacheKey(url: string, contentFingerprint: string, mode: string, model: string): string {
  const hash = hashString(`${url}::${contentFingerprint}::${mode}::${model}`);
  return `${STORAGE_KEYS.CACHE_PREFIX}${hash}`;
}

export async function getCachedSummary(key: string): Promise<SummaryResult | null> {
  const store = getStorageArea();
  const res = await store.get(key);
  if (res && res[key]) {
    return res[key] as SummaryResult;
  }
  return null;
}

export async function setCachedSummary(key: string, result: SummaryResult): Promise<void> {
  const store = getStorageArea();
  await store.set({ [key]: result });
}
