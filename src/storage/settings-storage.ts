import { ExtensionSettings } from '../shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';

// In-memory mock storage for testing and standalone environments
const memoryStore: Record<string, any> = {};

function getStorageArea(): {
  get: (keys: string | string[]) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
} {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: (keys) => chrome.storage.local.get(keys),
      set: (items) => chrome.storage.local.set(items),
      remove: (keys) => chrome.storage.local.remove(keys),
    };
  }

  return {
    get: async (keys) => {
      const result: Record<string, any> = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) {
        if (k in memoryStore) {
          result[k] = memoryStore[k];
        }
      }
      return result;
    },
    set: async (items) => {
      Object.assign(memoryStore, items);
    },
    remove: async (keys) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const k of keyList) {
        delete memoryStore[k];
      }
    },
  };
}

export async function getSettings(): Promise<ExtensionSettings> {
  const store = getStorageArea();
  const data = await store.get(STORAGE_KEYS.SETTINGS);
  if (!data || !data[STORAGE_KEYS.SETTINGS]) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    ...DEFAULT_SETTINGS,
    ...data[STORAGE_KEYS.SETTINGS],
  };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated: ExtensionSettings = {
    ...current,
    ...settings,
  };
  const store = getStorageArea();
  await store.set({ [STORAGE_KEYS.SETTINGS]: updated });
  return updated;
}

export async function clearApiKeys(): Promise<void> {
  const current = await getSettings();
  current.nvidiaApiKey = '';
  current.openrouterApiKey = '';
  const store = getStorageArea();
  await store.set({ [STORAGE_KEYS.SETTINGS]: current });
}
