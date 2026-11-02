export type ExplanationMode = 'ultra-simple' | 'eli12' | 'normal' | 'deep';

export type AIProviderType = 'nvidia' | 'openrouter';

export type SummaryLength = 'concise' | 'standard' | 'comprehensive';

export type AppTheme = 'system' | 'light' | 'dark';

export interface ModelOption {
  id: string;
  name: string;
  provider: AIProviderType;
  contextWindow: number;
  isFree?: boolean;
  recommended?: boolean;
  description?: string;
}

export interface ExtensionSettings {
  nvidiaApiKey: string;
  openrouterApiKey: string;
  primaryProvider: AIProviderType;
  primaryModel: string;
  fallbackProvider: AIProviderType;
  fallbackModel: string;
  defaultMode: ExplanationMode;
  maxSummaryLength: SummaryLength;
  historyEnabled: boolean;
  theme: AppTheme;
}

export interface ArticleContent {
  url: string;
  title: string;
  byline?: string;
  siteName?: string;
  description?: string;
  cleanedText: string;
  markdown: string;
  characterCount: number;
  estimatedWordCount: number;
  estimatedTokenCount: number;
  extractedAt: string;
}

export interface KeyPoint {
  point: string;
  explanation: string;
}

export interface ImportantNumber {
  value: string;
  context: string;
}

export interface DifficultTerm {
  term: string;
  simple_definition: string;
  example: string;
}

export interface ClaimCaveat {
  claim: string;
  type: string; // 'fact_claim_or_opinion_or_speculation' or 'fact' | 'opinion' | 'speculation' | 'claim'
  caveat: string;
}

export interface StructuredSummary {
  page_type: string;
  title: string;
  big_idea: string;
  simple_explanation: string;
  key_points: KeyPoint[];
  why_it_matters: string;
  real_world_example: string;
  important_numbers: ImportantNumber[];
  difficult_terms: DifficultTerm[];
  claims_and_caveats: ClaimCaveat[];
  bottom_line: string;
}

export interface SummaryResult {
  summary: StructuredSummary;
  mode: ExplanationMode;
  provider: AIProviderType;
  model: string;
  fallbackTriggered: boolean;
  originalModel?: string;
  cached: boolean;
  createdAt: string;
  url: string;
  title: string;
  domain: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  domain: string;
  title: string;
  bigIdea: string;
  bottomLine: string;
  mode: ExplanationMode;
  provider: AIProviderType;
  model: string;
  createdAt: string;
  summary: StructuredSummary;
}

export type ExtractionErrorCode =
  | 'UNSUPPORTED_PROTOCOL'
  | 'EMPTY_CONTENT'
  | 'RESTRICTED_PAGE'
  | 'PAYWALL_DETECTED'
  | 'READABILITY_FAILED'
  | 'SCRIPT_INJECTION_FAILED'
  | 'NOT_A_PDF'
  | 'PDF_TOO_LARGE'
  | 'PDF_PARSE_FAILED'
  | 'UNKNOWN';

export interface ExtractionResult {
  success: boolean;
  article?: ArticleContent;
  error?: {
    code: ExtractionErrorCode;
    message: string;
    details?: string;
  };
}

export interface SelectionExplanation {
  selectedText: string;
  context?: string;
  explanation: string;
  mode: ExplanationMode;
  provider: AIProviderType;
  model: string;
  createdAt: string;
}

export interface PageQuestionAnswer {
  question: string;
  answer: string;
  groundedInSource: boolean;
  provider: AIProviderType;
  model: string;
  createdAt: string;
}

// Inter-process message protocol
export type ExtensionMessage =
  | { type: 'EXTRACT_PAGE_CONTENT' }
  | { type: 'PAGE_CONTENT_EXTRACTED'; payload: ExtractionResult }
  | { type: 'TRIGGER_EXPLAIN_ACTIVE_TAB'; tabId: number; mode?: ExplanationMode; model?: string }
  | { type: 'EXPLAIN_SELECTION'; selectedText: string; context?: string; tabId: number }
  | { type: 'GET_ACTIVE_TAB_INFO' }
  | { type: 'SUMMARIZE_ARTICLE'; article: ArticleContent; mode: ExplanationMode; forceFresh?: boolean }
  | { type: 'EXPLAIN_TERM'; term: string; context: string }
  | { type: 'ASK_PAGE_QUESTION'; article: ArticleContent; question: string }
  | { type: 'HEALTH_CHECK_PROVIDER'; provider: AIProviderType; apiKey: string; modelId?: string };
