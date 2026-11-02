import React, { useState } from 'react';
import { Coffee, Settings, History, RefreshCw, Copy, Check, Download, Printer, Globe } from 'lucide-react';
import { ExplanationMode } from '../../shared/types';
import { EXPLANATION_MODES } from '../../shared/constants';
import { copyToClipboard } from '../../shared/utils';

interface SummaryHeaderProps {
  title: string;
  domain: string;
  mode: ExplanationMode;
  onModeChange: (mode: ExplanationMode) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onExportMarkdown: () => void;
  onPrint: () => void;
  getFullSummaryText: () => string;
  isLoading: boolean;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  title,
  domain,
  mode,
  onModeChange,
  onRefresh,
  onOpenSettings,
  onOpenHistory,
  onExportMarkdown,
  onPrint,
  getFullSummaryText,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getFullSummaryText();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur sticky top-0 z-20 px-4 py-3">
      {/* Brand row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-chai-600 flex items-center justify-center text-white shadow-sm">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100">
              Idiot Summary
            </span>
            <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              AI Explainer
            </span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy entire summary"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            title="Export as Markdown file"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onPrint}
            title="Print clean summary"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Re-explain page"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            title="Reading history"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & API Keys"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Article meta info */}
      <div className="mb-3">
        <h1 className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
          {title || 'Current Webpage'}
        </h1>
        {domain && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            <Globe className="w-3 h-3" />
            <span>{domain}</span>
          </div>
        )}
      </div>

      {/* Explanation Mode Selector */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-stone-100 dark:bg-stone-800/80 rounded-lg">
        {EXPLANATION_MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              disabled={isLoading}
              title={m.description}
              className={`py-1 px-1.5 text-[11px] font-medium rounded-md transition text-center truncate ${
                isActive
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {m.name.replace("Explain Like I'm 12", "ELI12")}
            </button>
          );
        })}
      </div>
    </header>
  );
};
