import React, { useState } from 'react';
import { Lightbulb, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../shared/utils';

interface BigIdeaProps {
  text: string;
}

export const BigIdea: React.FC<BigIdeaProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="group relative p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-stone-900 dark:text-stone-100">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>The Big Idea</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Big Idea"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-sm md:text-base font-medium leading-relaxed text-stone-800 dark:text-stone-100">
        {text}
      </p>
    </section>
  );
};
