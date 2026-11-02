/**
 * Offscreen document: extracts text from PDF bytes using pdf.js.
 * Runs in a DOM context, so pdf.js can spawn its worker normally.
 * Communicates with the service worker over runtime messages.
 */
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { PdfTextLine, pdfLinesToMarkdown, pdfLinesToCleanText } from '../shared/pdf-text';

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdf.worker.min.mjs');

const MAX_PAGES = 100;

interface ExtractPdfMessage {
  type: 'EXTRACT_PDF_TEXT';
  dataBase64: string;
}

interface ExtractPdfResponse {
  success: boolean;
  markdown?: string;
  cleanedText?: string;
  pageCount?: number;
  truncated?: boolean;
  error?: { code: string; message: string };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Extracts text lines (with font size + y position) from a PDF byte array. */
async function extractPdfLines(data: Uint8Array): Promise<{
  lines: PdfTextLine[];
  pageCount: number;
  truncated: boolean;
}> {
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  const limit = Math.min(total, MAX_PAGES);
  const lines: PdfTextLine[] = [];

  for (let pageNum = 1; pageNum <= limit; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let currentLine = '';
    let currentSize = 10;
    let currentY = 0;
    let hasPendingLine = false;

    const pushLine = () => {
      if (hasPendingLine) {
        lines.push({ text: currentLine.trim(), fontSize: currentSize, y: currentY });
        currentLine = '';
        hasPendingLine = false;
      }
    };

    for (const item of content.items as TextItem[]) {
      if (!('str' in item)) continue; // Skip TextMarkedContent
      const str = item.str;
      const size = item.transform[3] || 10;
      const y = item.transform[5];
      if (currentLine.trim().length === 0 && !hasPendingLine) {
        currentSize = size;
        currentY = y;
      }
      currentLine += str;
      hasPendingLine = true;
      if (item.hasEOL) {
        pushLine();
      }
    }
    pushLine();
    page.cleanup();
  }

  try {
    await loadingTask.destroy();
  } catch {
    // ignore
  }

  return { lines, pageCount: total, truncated: limit < total };
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(
    (message: ExtractPdfMessage, _sender, sendResponse: (r: ExtractPdfResponse) => void) => {
      if (message?.type !== 'EXTRACT_PDF_TEXT') return false;

      (async () => {
        try {
          if (!message.dataBase64 || typeof message.dataBase64 !== 'string') {
            sendResponse({ success: false, error: { code: 'EMPTY_CONTENT', message: 'No PDF data received.' } });
            return;
          }
          const bytes = base64ToUint8Array(message.dataBase64);
          if (bytes.length < 200) {
            sendResponse({ success: false, error: { code: 'EMPTY_CONTENT', message: 'PDF file appears to be empty.' } });
            return;
          }
          const { lines, pageCount, truncated } = await extractPdfLines(bytes);
          const markdown = pdfLinesToMarkdown(lines);
          const cleanedText = pdfLinesToCleanText(lines);
          if (cleanedText.length < 120) {
            sendResponse({
              success: false,
              error: {
                code: 'EMPTY_CONTENT',
                message: 'This PDF contains little or no extractable text (it may be a scanned image-only document).'
              }
            });
            return;
          }
          sendResponse({ success: true, markdown, cleanedText, pageCount, truncated });
        } catch (err: any) {
          console.error('Idiot Summary offscreen PDF extraction error:', err);
          sendResponse({
            success: false,
            error: {
              code: 'PDF_PARSE_FAILED',
              message: err?.message || 'Failed to parse the PDF document.'
            }
          });
        }
      })();

      return true; // async response
    }
  );
}
