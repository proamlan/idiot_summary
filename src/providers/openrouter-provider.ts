import { BaseAIProvider, SummarizeRequest, ExplainTextRequest, AskQuestionRequest, HealthCheckResult } from './base-provider';
import { AIProviderType, DifficultTerm, StructuredSummary } from '../shared/types';
import { OPENROUTER_BASE_URL, DEFAULT_OPENROUTER_MODEL, CHUNKING_CONFIG } from '../shared/constants';
import { AuthError, RateLimitError, TimeoutError, ProviderError } from '../shared/errors';
import { sleep } from '../shared/utils';
import { FOUNDATIONAL_SYSTEM_PROMPT, buildSummarizePrompt, buildSelectionPrompt, buildQuestionPrompt, buildTermPrompt } from '../ai/prompts/system-prompt';
import { validateStructuredSummary } from '../ai/response-validator';
import { splitIntoLogicalSections, buildChunkExtractionPrompt, buildMapReduceSynthesisPrompt } from '../ai/chunking';

export class OpenRouterProvider implements BaseAIProvider {
  readonly id: AIProviderType = 'openrouter';
  readonly name = 'OpenRouter';
  readonly defaultModel = DEFAULT_OPENROUTER_MODEL;

  constructor(private getApiKey: () => Promise<string> | string) {}

  private async makeChatCompletionRequest(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      timeoutMs?: number;
      apiKeyOverride?: string;
    } = {}
  ): Promise<string> {
    const apiKey = options.apiKeyOverride || (await this.getApiKey());
    if (!apiKey) {
      throw new AuthError('openrouter', 'OpenRouter API key is not configured. Please add it in Settings.');
    }

    const {
      temperature = 0.2,
      maxTokens = 4096,
      timeoutMs = 50000,
    } = options;

    const url = `${OPENROUTER_BASE_URL}/chat/completions`;
    const maxRetries = 2;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`,
            'HTTP-Referer': 'https://idiot-summary.extension',
            'X-Title': 'Idiot Summary Chrome Extension',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            top_p: 0.7,
            max_tokens: maxTokens,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          let errorBody = '';
          try {
            errorBody = await response.text();
          } catch {
            // ignore
          }

          if (status === 401 || status === 403) {
            throw new AuthError('openrouter', `OpenRouter authentication/authorization failure (${status}): ${errorBody}`);
          }

          if (status === 404) {
            throw new ProviderError(
              `Model "${model}" is not available on OpenRouter (404). Please select "openrouter/free" or another active free model in Settings.`,
              'openrouter',
              404,
              false
            );
          }

          if (status === 429) {
            if (attempt < maxRetries) {
              await sleep((attempt + 1) * 2000);
              continue;
            }
            throw new RateLimitError('openrouter', 'OpenRouter rate limit or credit limit exceeded.');
          }

          if (status >= 500 && status < 600) {
            if (attempt < maxRetries) {
              await sleep((attempt + 1) * 1500);
              continue;
            }
            throw new ProviderError(`OpenRouter server error (${status}): ${errorBody}`, 'openrouter', status, true);
          }

          throw new ProviderError(`OpenRouter request failed (${status}): ${errorBody}`, 'openrouter', status, false);
        }

        const data = await response.json();
        const msg = data?.choices?.[0]?.message;
        const content = msg?.content || msg?.reasoning;
        if (!content) {
          throw new ProviderError('Empty completion received from OpenRouter model.', 'openrouter');
        }

        return content;
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          if (attempt < maxRetries) {
            await sleep((attempt + 1) * 1500);
            continue;
          }
          throw new TimeoutError('openrouter', `OpenRouter request timed out after ${timeoutMs / 1000}s.`);
        }

        if (err instanceof AuthError) {
          throw err;
        }

        lastError = err;
        if (attempt < maxRetries) {
          await sleep((attempt + 1) * 1200);
        }
      }
    }

    throw lastError instanceof ProviderError
      ? lastError
      : new ProviderError(`OpenRouter request failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`, 'openrouter');
  }

  async summarize(request: SummarizeRequest): Promise<StructuredSummary> {
    const { article, mode, modelId = this.defaultModel } = request;

    if (article.estimatedTokenCount > CHUNKING_CONFIG.singlePassTokenThreshold) {
      const chunks = splitIntoLogicalSections(article.markdown);
      if (chunks.length > 1) {
        const activeChunks = chunks.slice(0, 4);
        const intermediateSummaries = await Promise.all(
          activeChunks.map(async (chunk) => {
            const chunkPrompt = buildChunkExtractionPrompt(chunk, article.title);
            return this.makeChatCompletionRequest(
              [
                { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
                { role: 'user', content: chunkPrompt },
              ],
              modelId,
              { maxTokens: 1200 }
            );
          })
        );

        const synthesisPrompt = buildMapReduceSynthesisPrompt(intermediateSummaries, mode, article.title, article.url);
        const finalOutput = await this.makeChatCompletionRequest(
          [
            { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
            { role: 'user', content: synthesisPrompt },
          ],
          modelId,
          { maxTokens: 4096 }
        );

        return validateStructuredSummary(finalOutput);
      }
    }

    const userPrompt = buildSummarizePrompt(article.markdown, mode, article.title, article.url);
    const rawOutput = await this.makeChatCompletionRequest(
      [
        { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      modelId,
      { maxTokens: 4096 }
    );

    return validateStructuredSummary(rawOutput);
  }

  async explain(request: ExplainTextRequest): Promise<string> {
    const { selectedText, context, mode = 'eli12', modelId = this.defaultModel } = request;
    const prompt = buildSelectionPrompt(selectedText, context, mode);

    return this.makeChatCompletionRequest(
      [
        { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      modelId,
      { maxTokens: 1000 }
    );
  }

  async askQuestion(request: AskQuestionRequest): Promise<string> {
    const { article, question, modelId = this.defaultModel } = request;
    const prompt = buildQuestionPrompt(question, article.markdown, article.title);

    return this.makeChatCompletionRequest(
      [
        { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      modelId,
      { maxTokens: 1500 }
    );
  }

  async explainTerms(terms: string[], context: string, modelId: string = this.defaultModel): Promise<DifficultTerm[]> {
    const results: DifficultTerm[] = [];
    for (const term of terms) {
      const prompt = buildTermPrompt(term, context);
      const explanation = await this.makeChatCompletionRequest(
        [
          { role: 'system', content: FOUNDATIONAL_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        modelId,
        { maxTokens: 400 }
      );
      results.push({
        term,
        simple_definition: explanation,
        example: '',
      });
    }
    return results;
  }

  async healthCheck(apiKeyOverride?: string, modelId: string = this.defaultModel): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await this.makeChatCompletionRequest(
        [
          { role: 'system', content: 'You are a health checker. Output OK.' },
          { role: 'user', content: 'ping' },
        ],
        modelId,
        {
          maxTokens: 100,
          timeoutMs: 25000,
          apiKeyOverride,
        }
      );
      return {
        ok: true,
        message: 'Connection to OpenRouter API successful.',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: err.message || 'Failed to connect to OpenRouter API.',
        latencyMs: Date.now() - start,
      };
    }
  }
}
