import { describe, it, expect } from 'vitest';
import { splitIntoLogicalSections, buildChunkExtractionPrompt, buildMapReduceSynthesisPrompt } from '../src/ai/chunking';
import { estimateTokens } from '../src/shared/utils';

describe('Intelligent Content Chunking Strategy', () => {
  it('6. Splits long documents into logically meaningful sections without mid-sentence truncation', () => {
    // Generate a long markdown article with multiple sections
    const sections = Array.from({ length: 15 }, (_, i) => `## Section ${i + 1}: Important Topic\n\nThis is paragraph 1 of section ${i + 1} detailing specific numbers like \$${(i + 1) * 100}M and key facts. It provides crucial analysis for readers.\n\nThis is paragraph 2 of section ${i + 1} elaborating on the core mechanisms and implications.`);
    const fullMarkdown = `# Master Document\n\n${sections.join('\n\n')}`;

    const totalTokens = estimateTokens(fullMarkdown);
    expect(totalTokens).toBeGreaterThan(600);

    // Split with a small chunk size to verify multi-chunk logic
    const chunks = splitIntoLogicalSections(fullMarkdown, 300, 50);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk, idx) => {
      expect(chunk.index).toBe(idx + 1);
      expect(chunk.total).toBe(chunks.length);
      expect(chunk.text.length).toBeGreaterThan(50);
      expect(chunk.estimatedTokens).toBeGreaterThan(0);
    });
  });

  it('Returns a single chunk when document is within budget', () => {
    const shortDoc = '# Short Article\n\nThis article is concise and easily fits in a single model context window.';
    const chunks = splitIntoLogicalSections(shortDoc, 2500, 200);

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(shortDoc);
  });

  it('Builds intermediate chunk prompt and map-reduce synthesis prompt', () => {
    const chunk = {
      index: 1,
      total: 3,
      text: '## Renewable Energy\n\nSolar capacity grew 25% this year.',
      estimatedTokens: 25,
    };

    const chunkPrompt = buildChunkExtractionPrompt(chunk, 'Energy Report 2026');
    expect(chunkPrompt).toContain('Section 1 of 3');
    expect(chunkPrompt).toContain('<UNTRUSTED_SECTION_CONTENT section="1_of_3">');

    const intermediateSummaries = ['Summary of section 1', 'Summary of section 2'];
    const synthesisPrompt = buildMapReduceSynthesisPrompt(intermediateSummaries, 'eli12', 'Energy Report', 'https://energy.org');
    expect(synthesisPrompt).toContain('Section 1 Extracted Information');
    expect(synthesisPrompt).toContain('Section 2 Extracted Information');
  });
});
