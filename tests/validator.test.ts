import { describe, it, expect } from 'vitest';
import { validateStructuredSummary } from '../src/ai/response-validator';
import { ValidationError } from '../src/shared/errors';

describe('Response Validator & JSON Parser', () => {
  it('12. Successfully parses clean JSON and handles markdown fenced JSON', () => {
    const raw = `Here is your summary:
\`\`\`json
{
  "page_type": "Article",
  "title": "Quantum Mechanics",
  "big_idea": "The study of nature at atomic scales.",
  "simple_explanation": "Small particles behave like ripples and balls at once.",
  "key_points": [
    { "point": "Wave-particle duality", "explanation": "Light can act like waves or particles." }
  ],
  "why_it_matters": "Enables semiconductors and lasers.",
  "real_world_example": "Like water ripples interfering with each other.",
  "important_numbers": [],
  "difficult_terms": [],
  "claims_and_caveats": [],
  "bottom_line": "Quantum physics describes the microscopic rules of the universe."
}
\`\`\`
Hope this helps!`;

    const summary = validateStructuredSummary(raw);
    expect(summary.title).toBe('Quantum Mechanics');
    expect(summary.big_idea).toBe('The study of nature at atomic scales.');
    expect(summary.key_points).toHaveLength(1);
  });

  it('Repairs JSON with trailing commas and surrounding text', () => {
    const rawWithTrailingCommas = `
      {
        "page_type": "Blog",
        "title": "Cooking Chai",
        "big_idea": "Chai is spiced tea with milk and aromatics.",
        "simple_explanation": "Boil black tea with ginger, cardamom, and whole milk.",
        "key_points": [
          { "point": "Spices", "explanation": "Cardamom and ginger provide warming flavor", },
        ],
        "why_it_matters": "Cultural comfort drink.",
        "real_world_example": "Like making hot cocoa, but with tea and fragrant spices.",
        "important_numbers": [],
        "difficult_terms": [],
        "claims_and_caveats": [],
        "bottom_line": "Chai brings people together over warmth.",
      }
    `;

    const summary = validateStructuredSummary(rawWithTrailingCommas);
    expect(summary.title).toBe('Cooking Chai');
    expect(summary.key_points[0].point).toBe('Spices');
  });

  it('Throws ValidationError when model output is completely invalid text', () => {
    const garbage = 'I am unable to answer this request because the system is offline.';
    expect(() => validateStructuredSummary(garbage)).toThrow(ValidationError);
  });
});
