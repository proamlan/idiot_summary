import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../shared/utils';

interface RealWorldExampleProps {
  text: string;
}

export const RealWorldExample: React.FC<RealWorldExampleProps> = ({ text }) => {
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
    <section className="group p-4 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800/80">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Real-World Example</span>
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
      <p className="text-xs md:text-sm leading-relaxed italic text-stone-700 dark:text-stone-300">
        "{text}"
      </p>
    </section>
  );
};
