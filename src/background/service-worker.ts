import { orchestrator } from './ai-orchestrator';
import { ExtensionMessage } from '../shared/types';
import { isArxivUrl, extractArxivPaper } from '../content/arxiv-extractor';
import { looksLikePdfUrl, extractPdfArticle } from './pdf-extractor';

// Setup Context Menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'idiot-summary-explain-selection',
    title: 'Explain with Idiot Summary',
    contexts: ['selection'],
  });
});

// Handle Context Menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'idiot-summary-explain-selection' && tab?.id) {
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) return;

    // Open side panel for this tab
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch {
      if (tab.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
    }

    // Persist pending selection explanation in local storage so side panel picks it up
    await chrome.storage.local.set({
      pending_selection_explanation: {
        selectedText,
        tabId: tab.id,
        timestamp: Date.now(),
      },
    });

    // Also broadcast message to active side panel if already open
    chrome.runtime.sendMessage({
      type: 'EXPLAIN_SELECTION',
      selectedText,
      tabId: tab.id,
    }).catch(() => {
      // Side panel may not be open yet; it will read from storage on mount
    });
  }
});

// Helper: inject content script if not already loaded in tab
async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => null);
    if (!ping) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
    }
    return true;
  } catch (err) {
    console.warn(`Could not inject content script into tab ${tabId}:`, err);
    return false;
  }
}

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((message: ExtensionMessage | any, _sender, sendResponse) => {
  // Return true if handling asynchronously
  (async () => {
    try {
      switch (message.type) {
        case 'GET_ACTIVE_TAB_INFO': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab || !tab.id) {
            sendResponse({ success: false, error: 'No active tab found' });
            return;
          }

          const targetUrl = tab.url || '';

          // 1. Direct handler for arXiv papers (PDFs, abstracts, or HTML)
          if (isArxivUrl(targetUrl)) {
            const arxivResult = await extractArxivPaper(targetUrl);
            if (!arxivResult.success && looksLikePdfUrl(targetUrl)) {
              // arXiv HTML wasn't available — try parsing the actual PDF bytes.
              const pdfResult = await extractPdfArticle(targetUrl, tab.title);
              if (pdfResult.success) {
                sendResponse({
                  success: true,
                  tab: { id: tab.id, url: targetUrl, title: pdfResult.article?.title || tab.title, favIconUrl: tab.favIconUrl },
                  extraction: pdfResult,
                });
                return;
              }
            }
            sendResponse({
              success: true,
              tab: {
                id: tab.id,
                url: targetUrl,
                title: arxivResult.article?.title || tab.title,
                favIconUrl: tab.favIconUrl,
              },
              extraction: arxivResult,
            });
            return;
          }

          // 2. Direct PDF handling (Chrome shows its internal PDF viewer where
          //    content scripts cannot run, so we fetch + parse the file here)
          if (looksLikePdfUrl(targetUrl)) {
            sendResponse({
              success: true,
              tab: { id: tab.id, url: targetUrl, title: tab.title, favIconUrl: tab.favIconUrl },
              extraction: await extractPdfArticle(targetUrl, tab.title),
            });
            return;
          }

          // 3. Standard webpage handling via content script
          await ensureContentScript(tab.id);

          try {
            const pageData = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE_CONTENT' });

            // If content script returned empty or failed, and it might be an arXiv URL:
            if ((!pageData || !pageData.success) && isArxivUrl(targetUrl)) {
              const fallbackArxiv = await extractArxivPaper(targetUrl);
              sendResponse({
                success: true,
                tab: { id: tab.id, url: targetUrl, title: fallbackArxiv.article?.title || tab.title },
                extraction: fallbackArxiv,
              });
              return;
            }

            // If content extraction failed (e.g. Chrome's PDF viewer replaced the
            // document without a .pdf URL suffix), probe whether the URL serves a PDF.
            if ((!pageData || !pageData.success) && /^https?:/i.test(targetUrl)) {
              const pdfProbe = await extractPdfArticle(targetUrl, tab.title);
              if (pdfProbe.success) {
                sendResponse({
                  success: true,
                  tab: { id: tab.id, url: targetUrl, title: pdfProbe.article?.title || tab.title, favIconUrl: tab.favIconUrl },
                  extraction: pdfProbe,
                });
                return;
              }
            }

            sendResponse({
              success: true,
              tab: {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                favIconUrl: tab.favIconUrl,
              },
              extraction: pageData,
            });
          } catch (extractErr: any) {
            // Content script messaging failed — likely an opaque page such as Chrome's
            // built-in PDF viewer. Probe for a PDF before giving up.
            let pdfProbe: Awaited<ReturnType<typeof extractPdfArticle>> | null = null;
            if (/^https?:/i.test(targetUrl)) {
              pdfProbe = await extractPdfArticle(targetUrl, tab.title);
              if (pdfProbe.success) {
                sendResponse({
                  success: true,
                  tab: { id: tab.id, url: targetUrl, title: pdfProbe.article?.title || tab.title, favIconUrl: tab.favIconUrl },
                  extraction: pdfProbe,
                });
                return;
              }
            }
            if (isArxivUrl(targetUrl)) {
              const fallbackArxiv = await extractArxivPaper(targetUrl);
              sendResponse({
                success: true,
                tab: { id: tab.id, url: targetUrl, title: fallbackArxiv.article?.title || tab.title },
                extraction: fallbackArxiv,
              });
              return;
            }

            sendResponse({
              success: false,
              tab: {
                id: tab.id,
                url: tab.url,
                title: tab.title,
              },
              error: (pdfProbe?.error?.message) || extractErr.message || 'Failed to extract content from tab',
            });
          }
          return;
        }

        case 'SUMMARIZE_ARTICLE': {
          const { article, mode, forceFresh } = message;
          const result = await orchestrator.summarizeArticle(article, mode, forceFresh);
          sendResponse({ success: true, result });
          return;
        }

        case 'EXPLAIN_SELECTION': {
          const { selectedText, context, tabId } = message;
          if (tabId) {
            try {
              await chrome.sidePanel.open({ tabId });
            } catch {
              // ignore
            }
          }
          const explanation = await orchestrator.explainSelection(selectedText, context);
          sendResponse({ success: true, explanation });
          return;
        }

        case 'ASK_PAGE_QUESTION': {
          const { article, question } = message;
          const qaResult = await orchestrator.askPageQuestion(article, question);
          sendResponse({ success: true, qaResult });
          return;
        }

        case 'EXPLAIN_TERM': {
          const { term, context } = message;
          const termResults = await orchestrator.explainTerm(term, context);
          sendResponse({ success: true, termResults });
          return;
        }

        case 'HEALTH_CHECK_PROVIDER': {
          const { provider, apiKey, modelId } = message;
          const status = await orchestrator.healthCheck(provider, apiKey, modelId);
          sendResponse(status);
          return;
        }

        case 'PING': {
          sendResponse({ ok: true });
          return;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
          return;
      }
    } catch (err: any) {
      console.error('Service worker error processing message:', err);
      sendResponse({
        success: false,
        error: err.message || 'Internal extension processing error',
        code: err.code || 'UNKNOWN_ERROR',
      });
    }
  })();

  return true; // Keep message channel open for async response
});
