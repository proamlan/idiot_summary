import { z } from 'zod';
import { StructuredSummary } from '../shared/types';
import { ValidationError } from '../shared/errors';

export const KeyPointSchema = z.object({
  point: z.string().default(''),
  explanation: z.string().default(''),
});

export const ImportantNumberSchema = z.object({
  value: z.string().default(''),
  context: z.string().default(''),
});

export const DifficultTermSchema = z.object({
  term: z.string().default(''),
  simple_definition: z.string().default(''),
  example: z.string().default(''),
});

export const ClaimCaveatSchema = z.object({
  claim: z.string().default(''),
  type: z.string().default('claim'),
  caveat: z.string().default(''),
});

export const StructuredSummarySchema = z.object({
  page_type: z.string().default('Article'),
  title: z.string().default('Summary'),
  big_idea: z.string().min(1, 'Big idea is required'),
  simple_explanation: z.string().min(1, 'Simple explanation is required'),
  key_points: z.array(KeyPointSchema).default([]),
  why_it_matters: z.string().default(''),
  real_world_example: z.string().default(''),
  important_numbers: z.array(ImportantNumberSchema).default([]),
  difficult_terms: z.array(DifficultTermSchema).default([]),
  claims_and_caveats: z.array(ClaimCaveatSchema).default([]),
  bottom_line: z.string().min(1, 'Bottom line is required'),
});

/**
 * Extracts a JSON substring from arbitrary LLM output.
 */
export function extractJsonFromText(rawText: string): string {
  if (!rawText) return '{}';

  // 1. Check for markdown code fences
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // 2. Look for outermost balanced { ... }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return rawText.substring(firstBrace, lastBrace + 1).trim();
  }

  return rawText.trim();
}

/**
 * Attempts simple heuristic repairs on slightly malformed JSON.
 */
function cleanJsonString(str: string): string {
  return str
    // Remove trailing commas in objects or arrays: { "a": 1, } -> { "a": 1 }
    .replace(/,\s*([}\]])/g, '$1')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Parses and validates raw model text into a typed StructuredSummary.
 */
export function validateStructuredSummary(rawText: string): StructuredSummary {
  const jsonCandidate = extractJsonFromText(rawText);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    try {
      const cleaned = cleanJsonString(jsonCandidate);
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      throw new ValidationError(
        'The AI model response was not valid JSON.',
        { rawPreview: rawText.slice(0, 300), error: parseErr instanceof Error ? parseErr.message : String(parseErr) }
      );
    }
  }

  const result = StructuredSummarySchema.safeParse(parsed);
  if (!result.success) {
    // If only minor fields failed, attempt to salvage
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, any>;
      const salvaged: StructuredSummary = {
        page_type: String(obj.page_type || 'Article'),
        title: String(obj.title || 'Summary'),
        big_idea: String(obj.big_idea || obj.summary || 'Summary overview'),
        simple_explanation: String(obj.simple_explanation || obj.explanation || 'Detailed explanation'),
        key_points: Array.isArray(obj.key_points) ? obj.key_points.map((k: any) => ({
          point: String(k.point || k.title || ''),
          explanation: String(k.explanation || k.desc || '')
        })) : [],
        why_it_matters: String(obj.why_it_matters || ''),
        real_world_example: String(obj.real_world_example || ''),
        important_numbers: Array.isArray(obj.important_numbers) ? obj.important_numbers.map((n: any) => ({
          value: String(n.value || ''),
          context: String(n.context || '')
        })) : [],
        difficult_terms: Array.isArray(obj.difficult_terms) ? obj.difficult_terms.map((t: any) => ({
          term: String(t.term || ''),
          simple_definition: String(t.simple_definition || t.definition || ''),
          example: String(t.example || '')
        })) : [],
        claims_and_caveats: Array.isArray(obj.claims_and_caveats) ? obj.claims_and_caveats.map((c: any) => ({
          claim: String(c.claim || ''),
          type: String(c.type || 'claim'),
          caveat: String(c.caveat || '')
        })) : [],
        bottom_line: String(obj.bottom_line || obj.conclusion || obj.big_idea || '')
      };

      if (salvaged.big_idea && salvaged.simple_explanation && salvaged.bottom_line) {
        return salvaged;
      }
    }

    throw new ValidationError(
      'AI response did not match the required summary schema.',
      result.error.format()
    );
  }

  return result.data;
}
