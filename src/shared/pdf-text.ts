/**
 * Pure helpers that shape raw pdf.js text lines into clean Markdown / plain text.
 * No DOM, chrome, or pdf.js dependencies — safe to unit-test and reuse anywhere.
 */

export interface PdfTextLine {
  text: string;
  fontSize: number;
  /** Vertical position (pdf.js transform f-component); used for paragraph-gap detection. */
  y: number;
}

/** A PDF line is probably a heading when it is notably larger than body text, short, and unpunctuated. */
export function isLikelyHeadingLine(line: PdfTextLine, bodyFontSize: number): boolean {
  const text = line.text.trim();
  if (!text || text.length > 100) return false;
  if (line.fontSize < bodyFontSize * 1.22) return false;
  if (line.fontSize < 9) return false;
  const words = text.split(/\s+/).length;
  if (words > 20) return false;
  // Sentences that end with terminal punctuation are rarely headings.
  if (/[.,;:]$/.test(text)) return false;
  // Mostly-number lines (dates, page numbers) are not headings.
  return /[A-Za-z\u00C0-\u024F]/.test(text);
}

/** Most-frequent font size (rounded) is treated as the document's body font size. */
export function computeBodyFontSize(lines: PdfTextLine[]): number {
  const freq = new Map<number, number>();
  for (const line of lines) {
    if (!line.text.trim()) continue;
    const size = Math.round(line.fontSize * 2) / 2;
    freq.set(size, (freq.get(size) || 0) + 1);
  }
  let bestCount = 0;
  let bodySize = 10;
  freq.forEach((count, size) => {
    if (count > bestCount || (count === bestCount && size > bodySize)) {
      bestCount = count;
      bodySize = size;
    }
  });
  return bodySize;
}

/**
 * Converts pdf.js text lines (with font-size and vertical position) into Markdown.
 * - Larger-than-body short lines become headings (# or ## by relative size).
 * - Large vertical gaps become paragraph breaks.
 * - Consecutive body lines are wrapped into flowing paragraphs.
 */
export function pdfLinesToMarkdown(lines: PdfTextLine[]): string {
  const valid = lines.filter((l) => l.text.trim().length > 0);
  if (valid.length === 0) return '';

  const bodySize = computeBodyFontSize(valid);
  let maxHeadingSize = 0;
  for (const line of valid) {
    if (isLikelyHeadingLine(line, bodySize)) {
      maxHeadingSize = Math.max(maxHeadingSize, line.fontSize);
    }
  }

  const paragraphs: string[] = [];
  let current: string[] = [];
  let prevY: number | null = null;

  const flush = () => {
    if (current.length > 0) {
      paragraphs.push(current.join(' '));
      current = [];
    }
  };

  for (const line of valid) {
    const text = line.text.trim();
    if (isLikelyHeadingLine(line, bodySize)) {
      flush();
      const heading = maxHeadingSize > 0 && line.fontSize >= maxHeadingSize - 0.5 ? '#' : '##';
      paragraphs.push(`${heading} ${text}`);
      prevY = line.y;
      continue;
    }

    const gap = prevY === null ? 0 : prevY - line.y;
    // A vertical jump notably larger than the body line spacing starts a new paragraph.
    if (prevY !== null && gap > bodySize * 1.85) {
      flush();
    }
    current.push(text.replace(/\s+/g, ' ').trim());
    prevY = line.y;
  }
  flush();

  return paragraphs
    .filter((p) => p.trim().length >= 2)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain-text variant used for cleanedText / token estimation. */
export function pdfLinesToCleanText(lines: PdfTextLine[]): string {
  return pdfLinesToMarkdown(lines)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
