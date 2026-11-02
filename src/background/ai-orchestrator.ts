import { NvidiaProvider } from '../providers/nvidia-provider';
import { OpenRouterProvider } from '../providers/openrouter-provider';
import { BaseAIProvider } from '../providers/base-provider';
import { getSettings } from '../storage/settings-storage';
import { computeCacheKey, getCachedSummary, setCachedSummary } from '../storage/cache-storage';
import { saveHistoryItem } from '../storage/history-storage';
import {
  ArticleContent,
  ExplanationMode,
  SummaryResult,
  StructuredSummary,
  AIProviderType,
  SelectionExplanation,
  PageQuestionAnswer,
  DifficultTerm
} from '../shared/types';
import { AuthError, AppError, ProviderError } from '../shared/errors';
import { hashString, extractDomain } from '../shared/utils';

// In-flight deduplication map: key -> Promise<SummaryResult>
const activeRequests = new Map<string, Promise<SummaryResult>>();

export class AIOrchestrator {
  private nvidiaProvider: NvidiaProvider;
  private openRouterProvider: OpenRouterProvider;

  constructor() {
    this.nvidiaProvider = new NvidiaProvider(async () => {
      const settings = await getSettings();
      return settings.nvidiaApiKey;
    });

    this.openRouterProvider = new OpenRouterProvider(async () => {
      const settings = await getSettings();
      return settings.openrouterApiKey;
    });
  }

  private getProvider(type: AIProviderType): BaseAIProvider {
    return type === 'nvidia' ? this.nvidiaProvider : this.openRouterProvider;
  }

  /**
   * Main summarization pipeline with caching, deduplication, and resilient fallback.
   */
  async summarizeArticle(
    article: ArticleContent,
    mode: ExplanationMode,
    forceFresh: boolean = false
  ): Promise<SummaryResult> {
    const settings = await getSettings();
    const primaryProviderType = settings.primaryProvider;
    const primaryModel = settings.primaryModel;
    const fallbackProviderType = settings.fallbackProvider;
    const fallbackModel = settings.fallbackModel;

    // Check cache
    const contentFingerprint = hashString(article.markdown.slice(0, 1000) + article.characterCount);
    const cacheKey = computeCacheKey(article.url, contentFingerprint, mode, primaryModel);

    if (!forceFresh) {
      const cached = await getCachedSummary(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
        };
      }
    }

    // Deduplicate identical in-flight requests
    const inflightKey = `${article.url}::${mode}::${primaryModel}`;
    const existing = activeRequests.get(inflightKey);
    if (existing) {
      return existing;
    }

    const task = (async (): Promise<SummaryResult> => {
      let finalSummary: StructuredSummary;
      let usedProvider = primaryProviderType;
      let usedModel = primaryModel;
      let fallbackTriggered = false;
      let primaryError: Error | null = null;

      // 1. Try Primary Provider
      try {
        const provider = this.getProvider(primaryProviderType);
        finalSummary = await provider.summarize({
          article,
          mode,
          modelId: primaryModel,
        });
      } catch (err: any) {
        primaryError = err;
        console.warn(`Primary provider (${primaryProviderType}) failed:`, err);

        // Check if fallback is viable and configured
        const isDifferentProvider = fallbackProviderType !== primaryProviderType || fallbackModel !== primaryModel;
        const hasFallbackKey =
          fallbackProviderType === 'nvidia' ? !!settings.nvidiaApiKey : !!settings.openrouterApiKey;

        if (isDifferentProvider && hasFallbackKey) {
          try {
            console.log(`Switching to fallback provider: ${fallbackProviderType} (${fallbackModel})...`);
            const fallbackProvider = this.getProvider(fallbackProviderType);
            finalSummary = await fallbackProvider.summarize({
              article,
              mode,
              modelId: fallbackModel,
            });
            usedProvider = fallbackProviderType;
            usedModel = fallbackModel;
            fallbackTriggered = true;
          } catch (fallbackErr: any) {
            console.error(`Fallback provider (${fallbackProviderType}) also failed:`, fallbackErr);
            throw new AppError(
              `Primary model (${primaryModel}) failed: ${primaryError?.message}. Fallback (${fallbackModel}) also failed: ${fallbackErr.message}`,
              'ALL_PROVIDERS_FAILED'
            );
          }
        } else {
          // If no distinct fallback is available or key is missing
          if (err instanceof AuthError) {
            throw err;
          }
          throw new ProviderError(
            `Summarization failed with ${primaryModel}: ${err.message}`,
            primaryProviderType,
            err.statusCode,
            false,
            err
          );
        }
      }

      const result: SummaryResult = {
        summary: finalSummary,
        mode,
        provider: usedProvider,
        model: usedModel,
        fallbackTriggered,
        originalModel: fallbackTriggered ? primaryModel : undefined,
        cached: false,
        createdAt: new Date().toISOString(),
        url: article.url,
        title: article.title || finalSummary.title || 'Untitled',
        domain: extractDomain(article.url),
      };

      // Cache result
      await setCachedSummary(cacheKey, result);

      // Save to history if enabled
      if (settings.historyEnabled) {
        await saveHistoryItem({
          url: article.url,
          title: article.title,
          summary: finalSummary,
          mode,
          provider: usedProvider,
          model: usedModel,
        });
      }

      return result;
    })();

    activeRequests.set(inflightKey, task);

    try {
      return await task;
    } finally {
      activeRequests.delete(inflightKey);
    }
  }

  /**
   * Explain a selected paragraph or sentence snippet.
   */
  async explainSelection(
    selectedText: string,
    context?: string,
    mode: ExplanationMode = 'eli12'
  ): Promise<SelectionExplanation> {
    const settings = await getSettings();
    const provider = this.getProvider(settings.primaryProvider);
    const explanation = await provider.explain({
      selectedText,
      context,
      mode,
      modelId: settings.primaryModel,
    });

    return {
      selectedText,
      context,
      explanation,
      mode,
      provider: settings.primaryProvider,
      model: settings.primaryModel,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Grounded Question & Answer against page content.
   */
  async askPageQuestion(article: ArticleContent, question: string): Promise<PageQuestionAnswer> {
    const settings = await getSettings();
    const provider = this.getProvider(settings.primaryProvider);
    const answer = await provider.askQuestion({
      article,
      question,
      modelId: settings.primaryModel,
    });

    const isUngrounded =
      answer.toLowerCase().includes('does not provide information') ||
      answer.toLowerCase().includes('not mentioned in the article');

    return {
      question,
      answer,
      groundedInSource: !isUngrounded,
      provider: settings.primaryProvider,
      model: settings.primaryModel,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Explain a specific difficult term.
   */
  async explainTerm(term: string, context: string): Promise<DifficultTerm[]> {
    const settings = await getSettings();
    const provider = this.getProvider(settings.primaryProvider);
    return provider.explainTerms([term], context, settings.primaryModel);
  }

  /**
   * Health check for provider connection verification.
   */
  async healthCheck(providerType: AIProviderType, apiKeyOverride?: string, modelId?: string) {
    const provider = this.getProvider(providerType);
    return provider.healthCheck(apiKeyOverride, modelId);
  }
}

export const orchestrator = new AIOrchestrator();
