import { describe, it, expect } from 'vitest';
import {
  isArxivUrl,
  parseArxivId,
  extractArxivPaper,
  decodeHtmlEntities,
  extractMetaTags
} from '../src/content/arxiv-extractor';

describe('arXiv Paper Extraction Pipeline', () => {
  it('Correctly identifies arXiv URLs', () => {
    expect(isArxivUrl('https://arxiv.org/pdf/2610.35959')).toBe(true);
    expect(isArxivUrl('https://arxiv.org/pdf/2610.35959.pdf')).toBe(true);
    expect(isArxivUrl('https://arxiv.org/abs/2610.35959')).toBe(true);
    expect(isArxivUrl('https://arxiv.org/html/2610.35959')).toBe(true);
    expect(isArxivUrl('https://example.com/test')).toBe(false);
  });

  it('Correctly parses arXiv identifier', () => {
    expect(parseArxivId('https://arxiv.org/pdf/2610.35959')).toBe('2610.35959');
    expect(parseArxivId('https://arxiv.org/pdf/2610.35959.pdf')).toBe('2610.35959');
    expect(parseArxivId('https://arxiv.org/html/2610.35959')).toBe('2610.35959');
    expect(parseArxivId('https://arxiv.org/abs/2610.35959v2.pdf')).toBe('2610.35959v2');
  });

  it('Decodes HTML entities correctly without DOM', () => {
    expect(decodeHtmlEntities('Einstein &amp; Bohr &lt;Theory&gt; &#39;1905&#39;')).toBe(
      "Einstein & Bohr <Theory> '1905'"
    );
  });

  it('Extracts meta tags correctly from raw HTML string', () => {
    const sampleHtml = `
      <meta name="citation_title" content="Test Paper Title">
      <meta name="citation_author" content="Alice Smith">
      <meta name="citation_author" content="Bob Jones">
      <meta name="citation_abstract" content="This is an abstract &amp; summary.">
    `;
    const metas = extractMetaTags(sampleHtml);
    expect(metas['citation_title']).toEqual(['Test Paper Title']);
    expect(metas['citation_author']).toEqual(['Alice Smith', 'Bob Jones']);
    expect(metas['citation_abstract']).toEqual(['This is an abstract & summary.']);
  });

  it('Extracts https://arxiv.org/pdf/2610.35959 by resolving to /html/ version without DOMParser', async () => {
    const origDOMParser = (globalThis as any).DOMParser;
    try {
      delete (globalThis as any).DOMParser;

      const result = await extractArxivPaper('https://arxiv.org/pdf/2610.35959');

      expect(result.success).toBe(true);
      expect(result.article).toBeDefined();
      expect(result.article?.title).toContain('AgentBaton');
      expect(result.article?.siteName).toBe('arXiv.org');
      expect(result.article?.cleanedText).toContain('AgentBaton');
      expect(result.article?.estimatedWordCount).toBeGreaterThan(100);
      expect(result.article?.markdown).toContain('## Abstract');
      // Verify token count is clean and compact for single-pass fast summarization
      expect(result.article?.estimatedTokenCount).toBeLessThan(4500);
    } finally {
      (globalThis as any).DOMParser = origDOMParser;
    }
  });

  it('Extracts https://arxiv.org/html/2610.35959 directly and accurately', async () => {
    const result = await extractArxivPaper('https://arxiv.org/html/2610.35959');

    expect(result.success).toBe(true);
    expect(result.article).toBeDefined();
    expect(result.article?.title).toContain('AgentBaton');
    expect(result.article?.markdown).toContain('## Abstract');
    expect(result.article?.markdown).toContain('Key Paper Sections');
    expect(result.article?.estimatedTokenCount).toBeLessThan(4500);
  });
});
