import React from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { DifficultTerm } from '../../shared/types';

interface DifficultTermsProps {
  terms: DifficultTerm[];
  onSelectTerm: (term: DifficultTerm) => void;
}

export const DifficultTerms: React.FC<DifficultTermsProps> = ({ terms, onSelectTerm }) => {
  if (!terms || terms.length === 0) return null;

  return (
    <section className="p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Things That Might Confuse You</span>
        </div>
        <span className="text-[10px] text-stone-400">Click term to explore</span>
      </div>

      <div className="space-y-2.5 mt-3">
        {terms.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectTerm(item)}
            className="cursor-pointer p-2.5 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700 bg-stone-50/70 dark:bg-stone-900/30 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                {item.term}
              </span>
              <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300 mt-1">
              {item.simple_definition}
            </p>
            {item.example && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500 italic mt-1">
                Analogy: {item.example}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
