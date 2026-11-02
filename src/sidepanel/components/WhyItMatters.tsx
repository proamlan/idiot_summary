import React, { useState } from 'react';
import { Compass, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../shared/utils';

interface WhyItMattersProps {
  text: string;
}

export const WhyItMatters: React.FC<WhyItMattersProps> = ({ text }) => {
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
    <section className="group p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
          <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Why Should I Care?</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-xs md:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {text}
      </p>
    </section>
  );
};
