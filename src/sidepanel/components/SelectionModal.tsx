import React, { useState } from 'react';
import { X, Quote, Sparkles, Copy, Check } from 'lucide-react';
import { SelectionExplanation } from '../../shared/types';
import { copyToClipboard } from '../../shared/utils';

interface SelectionModalProps {
  explanation: SelectionExplanation | null;
  onClose: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({ explanation, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!explanation) return null;

  const handleCopy = async () => {
    const text = `Selected snippet:\n"${explanation.selectedText}"\n\nExplanation:\n${explanation.explanation}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-3.5 border-b border-stone-200 dark:border-stone-800 bg-amber-500/10">
          <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
            <Sparkles className="w-4 h-4 text-chai-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Snippet Explanation</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              title="Copy snippet explanation"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Original selected snippet */}
          <div className="p-3 rounded-lg bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
              <Quote className="w-3 h-3" />
              <span>Original Selected Text</span>
            </div>
            <p className="text-xs italic text-stone-700 dark:text-stone-300 leading-relaxed">
              "{explanation.selectedText}"
            </p>
          </div>

          {/* Simple explanation */}
          <div>
            <div className="text-[10px] uppercase font-bold text-chai-700 dark:text-chai-400 mb-1">
              Explained Simply
            </div>
            <p className="text-xs md:text-sm text-stone-800 dark:text-stone-100 leading-relaxed whitespace-pre-line font-medium">
              {explanation.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
