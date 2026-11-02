import React, { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../shared/utils';
import { ExplanationMode } from '../../shared/types';

interface SimpleExplanationProps {
  text: string;
  mode: ExplanationMode;
}

export const SimpleExplanation: React.FC<SimpleExplanationProps> = ({ text, mode }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const title =
    mode === 'ultra-simple'
      ? 'Ultra Simple Explanation'
      : mode === 'eli12'
      ? "Explain It Like I'm 12"
      : mode === 'deep'
      ? 'Deep Technical Breakdown'
      : 'Plain English Breakdown';

  return (
    <section className="group relative p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
          <BookOpen className="w-3.5 h-3.5 text-chai-600 dark:text-chai-400" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy explanation"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 space-y-2 whitespace-pre-line">
        {text}
      </div>
    </section>
  );
};
