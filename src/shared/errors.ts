import { AIProviderType, ExtractionErrorCode } from './types';

export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class ExtractionError extends AppError {
  constructor(
    message: string,
    public readonly extractionCode: ExtractionErrorCode,
    public readonly details?: string
  ) {
    super(message, `EXTRACTION_${extractionCode}`);
    this.name = 'ExtractionError';
  }
}

export class ProviderError extends AppError {
  constructor(
    message: string,
    public readonly provider: AIProviderType,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
    public readonly rawError?: unknown
  ) {
    super(message, `PROVIDER_ERROR_${provider.toUpperCase()}`);
    this.name = 'ProviderError';
  }
}

export class AuthError extends ProviderError {
  constructor(provider: AIProviderType, message = 'Invalid or missing API key.') {
    super(message, provider, 401, false);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: AIProviderType, message = 'Rate limit exceeded. Try again in a few moments.') {
    super(message, provider, 429, true);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends ProviderError {
  constructor(provider: AIProviderType, message = 'Request timed out after waiting for response.') {
    super(message, provider, 408, true);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly validationIssues?: unknown) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
