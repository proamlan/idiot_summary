import { ExtensionSettings, ModelOption, ExplanationMode } from './types';

declare const __DEFAULT_NVIDIA_KEY__: string | undefined;
declare const __DEFAULT_OPENROUTER_KEY__: string | undefined;

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

export const MODEL_REGISTRY: ModelOption[] = [
  // NVIDIA NIM confirmed active models
  {
    id: 'nvidia/nemotron-3.5-bolt-e4b',
    name: 'Nemotron 3.5 Bolt (Fast & Recommended)',
    provider: 'nvidia',
    contextWindow: 8192,
    recommended: true,
    description: 'NVIDIA Nemotron 3.5 instruction model: ultra-fast, direct responses, zero reasoning latency.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B (Flagship)',
    provider: 'nvidia',
    contextWindow: 16384,
    description: 'Massive 550B parameter flagship model hosted on NVIDIA NIM for deep analysis.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'Nemotron 3.5 Lightning 30B (Deep Reasoning)',
    provider: 'nvidia',
    contextWindow: 8192,
    description: 'NVIDIA 30B instruction-tuned reasoning model with chain-of-thought analysis.'
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron 3 Nano Omni 30B',
    provider: 'nvidia',
    contextWindow: 8192,
    description: 'NVIDIA multimodal omni reasoning model.'
  },
  // OpenRouter verified working free models
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Router (Recommended)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    recommended: true,
    description: 'Dynamic free tier routing across available free models on OpenRouter.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron 3 Ultra 550B (Free)',
    provider: 'openrouter',
    contextWindow: 16384,
    isFree: true,
    description: 'Massive 550B parameter flagship model hosted freely via OpenRouter.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'NVIDIA 30B instruction-tuned reasoning model available on OpenRouter free tier.'
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'Nemotron 3.5 Super VL (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'Fast, high-capacity vision-language model available freely on OpenRouter.'
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid LFM 2.5 2.6B (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'Ultra-fast liquid neural network architecture for quick summaries.'
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots 3 Note Preview (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'High-speed note-taking and distillation model.'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'Cohere lightweight instruction model available on OpenRouter free tier.'
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'Nemotron 3 Nano Omni (Free)',
    provider: 'openrouter',
    contextWindow: 8192,
    isFree: true,
    description: 'Multimodal omni reasoning model hosted on OpenRouter.'
  }
];

export const DEFAULT_SETTINGS: ExtensionSettings = {
  nvidiaApiKey: typeof __DEFAULT_NVIDIA_KEY__ !== 'undefined' ? __DEFAULT_NVIDIA_KEY__ : '',
  openrouterApiKey: typeof __DEFAULT_OPENROUTER_KEY__ !== 'undefined' ? __DEFAULT_OPENROUTER_KEY__ : '',
  primaryProvider: 'nvidia',
  primaryModel: DEFAULT_NVIDIA_MODEL,
  fallbackProvider: 'openrouter',
  fallbackModel: DEFAULT_OPENROUTER_MODEL,
  defaultMode: 'eli12',
  maxSummaryLength: 'standard',
  historyEnabled: true,
  theme: 'system'
};

export const EXPLANATION_MODES: {
  id: ExplanationMode;
  name: string;
  tagline: string;
  description: string;
  badge: string;
}[] = [
  {
    id: 'ultra-simple',
    name: 'Ultra Simple',
    tagline: 'Zero prior knowledge needed',
    description: 'Short sentences, everyday vocabulary, relatable analogies. No unexplained jargon. Under 150 words.',
    badge: 'Beginner'
  },
  {
    id: 'eli12',
    name: "Explain Like I'm 12",
    tagline: 'Clear, engaging, and friendly',
    description: 'Taught like a curious 12-year-old. Relatable everyday examples, technical terms simplified. Never condescending.',
    badge: 'Popular'
  },
  {
    id: 'normal',
    name: 'Normal Human',
    tagline: 'Clear adult conversation',
    description: 'Concise adult language. Core technical terms retained and explained. Preserves the author’s main arguments.',
    badge: 'Balanced'
  },
  {
    id: 'deep',
    name: 'Deep Understanding',
    tagline: 'Thorough and nuanced breakdown',
    description: 'Comprehensive analysis. Technical terminology, assumptions, arguments, counterarguments, and uncertainties.',
    badge: 'In-Depth'
  }
];

export const STORAGE_KEYS = {
  SETTINGS: 'idiot_summary_settings',
  HISTORY: 'idiot_summary_history',
  CACHE_PREFIX: 'idiot_summary_cache_',
  LAST_TAB_RESULT: 'idiot_summary_last_result'
} as const;

export const MAX_HISTORY_ITEMS = 50;
export const MAX_CACHE_ITEMS = 30;

// Chunking constraints
export const CHUNKING_CONFIG = {
  maxTokensPerChunk: 3500,
  overlapTokens: 200,
  singlePassTokenThreshold: 6000,
};
