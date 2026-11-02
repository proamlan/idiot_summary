import '@testing-library/jest-dom';
import { vi } from 'vitest';

(globalThis as any).__DEFAULT_NVIDIA_KEY__ = '';
(globalThis as any).__DEFAULT_OPENROUTER_KEY__ = '';

// In-memory mock storage
const storageMap: Record<string, any> = {};

const chromeMock: any = {
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[]) => {
        if (typeof keys === 'string') {
          return { [keys]: storageMap[keys] };
        }
        if (Array.isArray(keys)) {
          const res: Record<string, any> = {};
          keys.forEach((k) => {
            if (k in storageMap) res[k] = storageMap[k];
          });
          return res;
        }
        return { ...storageMap };
      }),
      set: vi.fn(async (items: Record<string, any>) => {
        Object.assign(storageMap, items);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const list = Array.isArray(keys) ? keys : [keys];
        list.forEach((k) => delete storageMap[k]);
      }),
      clear: vi.fn(async () => {
        for (const k in storageMap) delete storageMap[k];
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
  },
  tabs: {
    query: vi.fn(async () => [{ id: 1, url: 'https://example.com/test', title: 'Example Page' }]),
    sendMessage: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

(globalThis as any).chrome = chromeMock;
