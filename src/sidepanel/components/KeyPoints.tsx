import React, { useState } from 'react';
import { ListChecks, Copy, Check } from 'lucide-react';
import { KeyPoint } from '../../shared/types';
import { copyToClipboard } from '../../shared/utils';

interface KeyPointsProps {
  points: KeyPoint[];
}

export const KeyPoints: React.FC<KeyPointsProps> = ({ points }) => {
  const [copied, setCopied] = useState(false);
  if (!points || points.length === 0) return null;

  const handleCopy = async () => {
    const text = points.map((p, i) => `${i + 1}. ${p.point}: ${p.explanation}`).join('\n');
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
          <ListChecks className="w-3.5 h-3.5 text-chai-600 dark:text-chai-400" />
          <span>The Important Stuff</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Key Points"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="space-y-3">
        {points.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-chai-100 dark:bg-chai-900/60 text-chai-800 dark:text-chai-300 text-xs font-semibold flex items-center justify-center mt-0.5">
              {idx + 1}
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                {item.point}
              </h4>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                {item.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
