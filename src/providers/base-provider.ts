import { AIProviderType, ArticleContent, ExplanationMode, StructuredSummary, DifficultTerm } from '../shared/types';

export interface SummarizeRequest {
  article: ArticleContent;
  mode: ExplanationMode;
  modelId?: string;
  onStreamChunk?: (partialText: string) => void;
}

export interface ExplainTextRequest {
  selectedText: string;
  context?: string;
  mode?: ExplanationMode;
  modelId?: string;
}

export interface AskQuestionRequest {
  article: ArticleContent;
  question: string;
  modelId?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

export interface BaseAIProvider {
  readonly id: AIProviderType;
  readonly name: string;
  readonly defaultModel: string;

  summarize(request: SummarizeRequest): Promise<StructuredSummary>;
  explain(request: ExplainTextRequest): Promise<string>;
  askQuestion(request: AskQuestionRequest): Promise<string>;
  explainTerms(terms: string[], context: string, modelId?: string): Promise<DifficultTerm[]>;
  healthCheck(apiKey?: string, modelId?: string): Promise<HealthCheckResult>;
}
