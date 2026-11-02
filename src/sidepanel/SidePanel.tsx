import React, { useState, useEffect, useCallback } from 'react';
import {
  ArticleContent,
  ExplanationMode,
  SummaryResult,
  HistoryItem,
  DifficultTerm,
  SelectionExplanation,
  PageQuestionAnswer,
  ExtractionResult,
} from '../shared/types';
import { getSettings } from '../storage/settings-storage';
import { getHistory, deleteHistoryItem, clearHistory } from '../storage/history-storage';
import { exportAsMarkdown } from '../shared/utils';
import { SummaryHeader } from './components/SummaryHeader';
import { BigIdea } from './components/BigIdea';
import { SimpleExplanation } from './components/SimpleExplanation';
import { KeyPoints } from './components/KeyPoints';
import { WhyItMatters } from './components/WhyItMatters';
import { RealWorldExample } from './components/RealWorldExample';
import { ImportantNumbers } from './components/ImportantNumbers';
import { DifficultTerms } from './components/DifficultTerms';
import { ClaimsAndCaveats } from './components/ClaimsAndCaveats';
import { BottomLine } from './components/BottomLine';
import { AskPageQuestion } from './components/AskPageQuestion';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { TermModal } from './components/TermModal';
import { SelectionModal } from './components/SelectionModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AlertCircle, Coffee, Sparkles, Settings as SettingsIcon } from 'lucide-react';

export const SidePanel: React.FC = () => {
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [mode, setMode] = useState<ExplanationMode>('eli12');
  const [loadingStage, setLoadingStage] = useState<'idle' | 'extracting' | 'summarizing'>('idle');
  const [error, setError] = useState<{ message: string; code?: string; isApiKeyIssue?: boolean } | null>(null);

  // Modals & Drawers state
  const [selectedTerm, setSelectedTerm] = useState<DifficultTerm | null>(null);
  const [selectionExplanation, setSelectionExplanation] = useState<SelectionExplanation | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Active tab details
  const [tabInfo, setTabInfo] = useState<{ id?: number; url?: string; title?: string }>({});

  // Load history
  const refreshHistory = useCallback(async () => {
    const items = await getHistory();
    setHistoryItems(items);
  }, []);

  // Run summarization on given article
  const runSummarize = useCallback(async (targetArticle: ArticleContent, targetMode: ExplanationMode, forceFresh = false) => {
    setLoadingStage('summarizing');
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_ARTICLE',
        article: targetArticle,
        mode: targetMode,
        forceFresh,
      });

      if (response && response.success && response.result) {
        setSummaryResult(response.result);
        await refreshHistory();
      } else {
        const errMsg = response?.error || 'Summarization failed.';
        const isAuth = errMsg.toLowerCase().includes('api key') || response?.code === 'PROVIDER_ERROR_AUTH';
        setError({
          message: errMsg,
          code: response?.code,
          isApiKeyIssue: isAuth,
        });
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to communicate with background service.',
      });
    } finally {
      setLoadingStage('idle');
    }
  }, [refreshHistory]);

  // Extract page content from active tab
  const extractAndExplain = useCallback(async (forcedMode?: ExplanationMode, forceFresh = false) => {
    setLoadingStage('extracting');
    setError(null);

    const settings = await getSettings();
    const effectiveMode = forcedMode || settings.defaultMode || 'eli12';
    setMode(effectiveMode);

    try {
      const tabResponse = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_INFO' });
      if (!tabResponse || !tabResponse.success) {
        setError({
          message: tabResponse?.error || 'Could not access the active webpage. Make sure it is an HTTP or HTTPS page.',
        });
        setLoadingStage('idle');
        return;
      }

      setTabInfo(tabResponse.tab || {});

      const extraction: ExtractionResult = tabResponse.extraction;
      if (!extraction || !extraction.success || !extraction.article) {
        setError({
          message: extraction?.error?.message || 'Article content extraction was unsuccessful on this page.',
          code: extraction?.error?.code,
        });
        setLoadingStage('idle');
        return;
      }

      setArticle(extraction.article);
      await runSummarize(extraction.article, effectiveMode, forceFresh);
    } catch (err: any) {
      setError({
        message: err.message || 'An error occurred while inspecting the page.',
      });
      setLoadingStage('idle');
    }
  }, [runSummarize]);

  // Initial setup: check pending selection, messages, or auto-load active tab
  useEffect(() => {
    refreshHistory();

    // Check if there is a pending selection explanation from context menu
    chrome.storage.local.get('pending_selection_explanation').then(async (data) => {
      const pending = data?.pending_selection_explanation;
      if (pending && Date.now() - pending.timestamp < 30000) {
        await chrome.storage.local.remove('pending_selection_explanation');
        try {
          const res = await chrome.runtime.sendMessage({
            type: 'EXPLAIN_SELECTION',
            selectedText: pending.selectedText,
          });
          if (res?.success && res.explanation) {
            setSelectionExplanation(res.explanation);
          }
        } catch {
          // ignore
        }
      }
    });

    // Listen for runtime messages (e.g. from popup or content script)
    const listener = (message: any) => {
      if (message.type === 'TRIGGER_EXPLAIN_ACTIVE_TAB') {
        extractAndExplain(message.mode, true);
      } else if (message.type === 'EXPLAIN_SELECTION') {
        chrome.runtime.sendMessage(message).then((res) => {
          if (res?.success && res.explanation) {
            setSelectionExplanation(res.explanation);
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Initial inspection of active tab
    extractAndExplain();

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [extractAndExplain, refreshHistory]);

  // Handle mode switch without re-extracting
  const handleModeChange = async (newMode: ExplanationMode) => {
    if (newMode === mode || loadingStage !== 'idle') return;
    setMode(newMode);
    if (article) {
      await runSummarize(article, newMode, false);
    } else {
      await extractAndExplain(newMode);
    }
  };

  // Ask Question
  const handleAskQuestion = async (q: string): Promise<PageQuestionAnswer> => {
    if (!article) {
      throw new Error('No article loaded to ask questions about.');
    }
    const res = await chrome.runtime.sendMessage({
      type: 'ASK_PAGE_QUESTION',
      article,
      question: q,
    });
    if (res?.success && res.qaResult) {
      return res.qaResult;
    }
    throw new Error(res?.error || 'Failed to answer question.');
  };

  // Custom term lookup
  const handleExplainCustomTerm = async (term: string): Promise<DifficultTerm> => {
    const res = await chrome.runtime.sendMessage({
      type: 'EXPLAIN_TERM',
      term,
      context: article?.cleanedText.slice(0, 500) || '',
    });
    if (res?.success && res.termResults && res.termResults.length > 0) {
      return res.termResults[0];
    }
    return {
      term,
      simple_definition: 'Could not generate explanation for this term.',
      example: '',
    };
  };

  // Export as Markdown
  const handleExportMarkdown = () => {
    if (!summaryResult) return;
    const md = exportAsMarkdown(summaryResult.summary, summaryResult.url);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (summaryResult.title || 'summary').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `idiot-summary-${cleanTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Open settings
  const handleOpenSettings = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('settings.html', '_blank');
    }
  };

  const getFullSummaryText = (): string => {
    if (!summaryResult) return '';
    return exportAsMarkdown(summaryResult.summary, summaryResult.url);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex flex-col font-sans pb-10">
      {/* Sticky Top Header */}
      <SummaryHeader
        title={article?.title || tabInfo.title || 'Idiot Summary'}
        domain={summaryResult?.domain || (tabInfo.url ? new URL(tabInfo.url).hostname : '')}
        mode={mode}
        onModeChange={handleModeChange}
        onRefresh={() => extractAndExplain(mode, true)}
        onOpenSettings={handleOpenSettings}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onExportMarkdown={handleExportMarkdown}
        onPrint={handlePrint}
        getFullSummaryText={getFullSummaryText}
        isLoading={loadingStage !== 'idle'}
      />

      <main className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Loading Skeleton */}
        {loadingStage !== 'idle' && (
          <LoadingSkeleton
            stage={loadingStage}
            modelName={summaryResult?.model}
          />
        )}

        {/* Error Card */}
        {error && loadingStage === 'idle' && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Explanation Halted
                </h3>
                <p className="text-xs mt-1 leading-relaxed">
                  {error.message}
                </p>
              </div>
            </div>

            {error.isApiKeyIssue && (
              <button
                type="button"
                onClick={handleOpenSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Configure API Keys in Settings</span>
              </button>
            )}
          </div>
        )}

        {/* Empty State when no summary and no error */}
        {!summaryResult && loadingStage === 'idle' && !error && (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-chai-600 mx-auto flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Ready to Explain</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Click below to break down this webpage into simple everyday terms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => extractAndExplain(mode, true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-chai-600 hover:bg-chai-700 text-white font-medium text-xs shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explain This Page</span>
            </button>
          </div>
        )}

        {/* Structured Summary Dashboard */}
        {summaryResult && loadingStage === 'idle' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. THE BIG IDEA */}
            <BigIdea text={summaryResult.summary.big_idea} />

            {/* 2. EXPLAIN IT LIKE I'M 12 */}
            <SimpleExplanation text={summaryResult.summary.simple_explanation} mode={mode} />

            {/* 3. THE IMPORTANT STUFF */}
            <KeyPoints points={summaryResult.summary.key_points} />

            {/* 4. WHY SHOULD I CARE? */}
            <WhyItMatters text={summaryResult.summary.why_it_matters} />

            {/* 5. REAL-WORLD EXAMPLE */}
            <RealWorldExample text={summaryResult.summary.real_world_example} />

            {/* 6. NUMBERS THAT MATTER */}
            <ImportantNumbers numbers={summaryResult.summary.important_numbers} />

            {/* 7. THINGS THAT MIGHT CONFUSE YOU */}
            <DifficultTerms
              terms={summaryResult.summary.difficult_terms}
              onSelectTerm={(t) => setSelectedTerm(t)}
            />

            {/* CLAIMS, FACTS & OPINIONS */}
            <ClaimsAndCaveats items={summaryResult.summary.claims_and_caveats} />

            {/* 8. THE BOTTOM LINE */}
            <BottomLine text={summaryResult.summary.bottom_line} />

            {/* Interactive Question Input */}
            <AskPageQuestion
              onAsk={handleAskQuestion}
              isLoading={loadingStage !== 'idle'}
            />

            {/* Provenance Badge */}
            <div className="p-3 rounded-lg bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <div>
                <span>Model: </span>
                <span className="font-mono text-[10px] text-stone-700 dark:text-stone-300 font-semibold">
                  {summaryResult.model}
                </span>
                {summaryResult.fallbackTriggered && (
                  <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    (Fallback provider used)
                  </span>
                )}
              </div>
              {summaryResult.cached && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                  Cached
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Difficult Term Explainer Modal */}
      <TermModal
        term={selectedTerm}
        onClose={() => setSelectedTerm(null)}
        onExplainCustomTerm={handleExplainCustomTerm}
      />

      {/* Selection Snippet Modal */}
      <SelectionModal
        explanation={selectionExplanation}
        onClose={() => setSelectionExplanation(null)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={historyItems}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={(item) => {
          setSummaryResult({
            summary: item.summary,
            mode: item.mode,
            provider: item.provider,
            model: item.model,
            fallbackTriggered: false,
            cached: true,
            createdAt: item.createdAt,
            url: item.url,
            title: item.title,
            domain: item.domain,
          });
          setMode(item.mode);
        }}
        onDeleteItem={async (id) => {
          await deleteHistoryItem(id);
          await refreshHistory();
        }}
        onClearHistory={async () => {
          await clearHistory();
          await refreshHistory();
        }}
      />
    </div>
  );
};
