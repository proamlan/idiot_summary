import { extractPageContent } from './page-extractor';
import { initSelectionHandler } from './selection-handler';

// Initialize text selection listener
try {
  initSelectionHandler();
} catch (err) {
  console.warn('Idiot Summary: selection handler init error', err);
}

// Listen for messages from popup, side panel, or background worker
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'EXTRACT_PAGE_CONTENT') {
      try {
        const result = extractPageContent(document, window.location.href);
        sendResponse(result);
      } catch (err) {
        sendResponse({
          success: false,
          error: {
            code: 'READABILITY_FAILED',
            message: err instanceof Error ? err.message : 'Unknown extraction failure'
          }
        });
      }
      return false; // synchronous response
    }

    return false;
  });
}
