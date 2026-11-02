import { ModelOption, AIProviderType } from '../shared/types';
import { MODEL_REGISTRY, DEFAULT_NVIDIA_MODEL, DEFAULT_OPENROUTER_MODEL } from '../shared/constants';

let customModels: ModelOption[] = [];

export function getAvailableModels(): ModelOption[] {
  return [...MODEL_REGISTRY, ...customModels];
}

export function getModelsByProvider(provider: AIProviderType): ModelOption[] {
  return getAvailableModels().filter((m) => m.provider === provider);
}

export function findModel(modelId: string): ModelOption | undefined {
  return getAvailableModels().find((m) => m.id === modelId);
}

export function getDefaultModelForProvider(provider: AIProviderType): string {
  return provider === 'nvidia' ? DEFAULT_NVIDIA_MODEL : DEFAULT_OPENROUTER_MODEL;
}

export function registerCustomModel(model: ModelOption): void {
  if (!customModels.some((m) => m.id === model.id)) {
    customModels.push(model);
  }
}
