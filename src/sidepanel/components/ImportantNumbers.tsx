import React, { useState } from 'react';
import { Hash, Copy, Check } from 'lucide-react';
import { ImportantNumber } from '../../shared/types';
import { copyToClipboard } from '../../shared/utils';

interface ImportantNumbersProps {
  numbers: ImportantNumber[];
}

export const ImportantNumbers: React.FC<ImportantNumbersProps> = ({ numbers }) => {
  const [copied, setCopied] = useState(false);
  if (!numbers || numbers.length === 0) return null;

  const handleCopy = async () => {
    const text = numbers.map((n) => `${n.value}: ${n.context}`).join('\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="group p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
          <Hash className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Numbers That Matter</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Numbers"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {numbers.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800/80"
          >
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {item.value}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
              {item.context}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
