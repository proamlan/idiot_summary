import React, { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../shared/utils';

interface BottomLineProps {
  text: string;
}

export const BottomLine: React.FC<BottomLineProps> = ({ text }) => {
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
    <section className="group p-4 rounded-xl bg-stone-900 dark:bg-stone-950 text-white shadow-sm border border-stone-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-chai-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>The Bottom Line</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Bottom Line"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-white transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-sm font-medium leading-relaxed text-stone-100">
        {text}
      </p>
    </section>
  );
};
