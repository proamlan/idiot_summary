import { describe, it, expect } from 'vitest';
import {
  PdfTextLine,
  isLikelyHeadingLine,
  computeBodyFontSize,
  pdfLinesToMarkdown,
  pdfLinesToCleanText,
} from '../src/shared/pdf-text';
import { looksLikePdfUrl } from '../src/background/pdf-extractor';

function line(text: string, fontSize: number, y: number): PdfTextLine {
  return { text, fontSize, y };
}

describe('PDF URL detection', () => {
  it('detects .pdf URLs regardless of query strings', () => {
    expect(looksLikePdfUrl('https://example.com/paper.pdf')).toBe(true);
    expect(looksLikePdfUrl('https://example.com/paper.PDF')).toBe(true);
    expect(looksLikePdfUrl('https://example.com/some/path/report.pdf?download=1')).toBe(true);
    expect(looksLikePdfUrl('https://example.com/paper.pdf#page=2')).toBe(true);
  });

  it('rejects non-pdf URLs', () => {
    expect(looksLikePdfUrl('https://example.com/page.html')).toBe(false);
    expect(looksLikePdfUrl('https://example.com/pdf-reader.html')).toBe(false);
    expect(looksLikePdfUrl('')).toBe(false);
  });
});

describe('computeBodyFontSize', () => {
  it('returns the most frequent font size as the body size', () => {
    const lines = [
      line('Body line one', 10, 700),
      line('Body line two', 10, 690),
      line('Body line three', 10, 680),
      line('A Heading', 18, 640),
      line('Body line four', 10, 610),
    ];
    expect(computeBodyFontSize(lines)).toBe(10);
  });
});

describe('isLikelyHeadingLine', () => {
  it('flags lines significantly larger than body text that are short and unpunctuated', () => {
    expect(isLikelyHeadingLine(line('Introduction', 18, 700), 10)).toBe(true);
    expect(isLikelyHeadingLine(line('3 Methodology', 14, 700), 10)).toBe(true);
  });

  it('rejects body-sized or long punctuated lines', () => {
    expect(isLikelyHeadingLine(line('Regular body text here.', 10, 700), 10)).toBe(false);
    expect(isLikelyHeadingLine(line('A very long heading that goes on and on and on and clearly is not a heading at all because it ends with a period.', 18, 700), 10)).toBe(false);
    expect(isLikelyHeadingLine(line('This sentence ends with a period.', 18, 700), 10)).toBe(false);
  });
});

describe('pdfLinesToMarkdown', () => {
  it('converts large short lines into headings and body lines into paragraphs', () => {
    const lines = [
      line('Quantum Computing Basics', 22, 700),
      line('Quantum computers use qubits instead of classical bits to', 10, 660),
      line('encode and process information in parallel states.', 10, 650),
    ];
    const md = pdfLinesToMarkdown(lines);
    expect(md).toContain('# Quantum Computing Basics');
    expect(md).toContain('encode and process information in parallel states.');
    expect(md).not.toMatch(/to\-\s*encode/);
  });

  it('creates paragraph breaks on large vertical gaps', () => {
    const lines = [
      line('First paragraph first sentence.', 10, 700),
      line('First paragraph second sentence.', 10, 690),
      line('Second paragraph sentence starts here.', 10, 560),
    ];
    const md = pdfLinesToMarkdown(lines);
    const paragraphs = md.split('\n\n');
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0]).toContain('First paragraph first sentence.');
    expect(paragraphs[1]).toContain('Second paragraph sentence starts here.');
  });

  it('wraps tightly-spaced body lines into a single flowing paragraph', () => {
    const lines = [
      line('This is the first visual line of the paragraph.', 10, 700),
      line('This is the second visual line of the same paragraph.', 10, 690),
    ];
    const md = pdfLinesToMarkdown(lines);
    expect(md.split('\n\n')).toHaveLength(1);
    expect(md).toContain('paragraph. This is the second visual line');
  });

  it('returns empty string for no lines', () => {
    expect(pdfLinesToMarkdown([])).toBe('');
  });
});

describe('pdfLinesToCleanText', () => {
  it('strips heading markers and collapses blank lines', () => {
    const lines = [
      line('My Great Title', 22, 700),
      line('Some body content.', 10, 660),
    ];
    const text = pdfLinesToCleanText(lines);
    expect(text).not.toContain('#');
    expect(text).toContain('My Great Title');
    expect(text).toContain('Some body content.');
  });
});
