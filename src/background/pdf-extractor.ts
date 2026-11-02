import { ArticleContent, ExtractionResult } from '../shared/types';
import { estimateTokens } from '../shared/utils';

const MAX_PDF_BYTES = 32 * 1024 * 1024; // 32 MB safety cap

/** Heuristic: URL path ends with .pdf (ignoring query/hash). */
export function looksLikePdfUrl(url: string): boolean {
  if (!url) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith('.pdf');
  } catch {
    return false;
  }
}

/** Ensures an offscreen document exists (needed to parse PDFs with pdf.js). */
async function ensureOffscreenDocument(): Promise<void> {
  const offscreen = (chrome as any).offscreen;
  if (!offscreen) {
    throw new Error('Offscreen API unavailable in this Chrome version.');
  }
  if (await offscreen.hasDocument()) return;
  await offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: 'Extract text from PDF documents so Idiot Summary can summarize them.'
  });
}

/** Sends base64-encoded PDF bytes to the offscreen document and awaits extracted text. */
async function extractPdfTextFromBytes(dataBase64: string): Promise<{
  markdown: string;
  cleanedText: string;
  pageCount: number;
  truncated: boolean;
}> {
  await ensureOffscreenDocument();

  const response = await chrome.runtime.sendMessage({
    type: 'EXTRACT_PDF_TEXT',
    dataBase64
  });

  if (!response || typeof response !== 'object') {
    throw new Error('PDF extraction did not respond.');
  }
  if (!response.success) {
    throw new Error(response.error?.message || 'PDF text extraction failed.');
  }
  return {
    markdown: response.markdown || '',
    cleanedText: response.cleanedText || '',
    pageCount: response.pageCount || 0,
    truncated: !!response.truncated
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function titleFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return decoded.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || 'PDF Document';
  } catch {
    return 'PDF Document';
  }
}

function buildArticle(
  url: string,
  markdown: string,
  cleanedText: string,
  pageCount: number,
  truncated: boolean,
  titleHint?: string
): ArticleContent {
  const title = (titleHint || '').trim() || titleFromUrl(url);
  const header: string[] = [];
  if (pageCount) {
    header.push(`**Pages**: ${pageCount}${truncated ? ' (only the first 100 pages were analyzed)' : ''}`);
  }
  const composed = header.length ? `${header.join('\n')}\n\n${markdown}` : markdown;
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

  return {
    url,
    title,
    siteName: 'PDF Document',
    description: `PDF document${pageCount ? ` with ${pageCount} pages` : ''}`,
    cleanedText,
    markdown: composed,
    characterCount: composed.length,
    estimatedWordCount: wordCount,
    estimatedTokenCount: estimateTokens(composed),
    extractedAt: new Date().toISOString()
  };
}

/**
 * Fetches the PDF at `url`, verifies it really is a PDF (content-type),
 * and extracts its text via the offscreen pdf.js document.
 */
export async function extractPdfArticle(url: string, titleHint?: string): Promise<ExtractionResult> {
  let buf: ArrayBuffer;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok && res.status !== 206) {
      return {
        success: false,
        error: { code: 'EMPTY_CONTENT', message: `Could not download the PDF (server returned ${res.status}).` }
      };
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('pdf')) {
      return {
        success: false,
        error: { code: 'NOT_A_PDF', message: 'The URL did not return a PDF document.' }
      };
    }
    buf = await res.arrayBuffer();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NOT_A_PDF', message: `Could not download the PDF: ${err?.message || err}` }
    };
  }

  if (buf.byteLength < 200) {
    return { success: false, error: { code: 'EMPTY_CONTENT', message: 'The PDF file appears to be empty.' } };
  }
  if (buf.byteLength > MAX_PDF_BYTES) {
    return {
      success: false,
      error: { code: 'PDF_TOO_LARGE', message: 'This PDF is larger than 32 MB and cannot be processed.' }
    };
  }

  try {
    const text = await extractPdfTextFromBytes(arrayBufferToBase64(buf));
    const article = buildArticle(url, text.markdown, text.cleanedText, text.pageCount, text.truncated, titleHint);
    return { success: true, article };
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'PDF_PARSE_FAILED', message: err?.message || 'Failed to extract text from the PDF.' }
    };
  }
}
