import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ClaimCaveat } from '../../shared/types';

interface ClaimsAndCaveatsProps {
  items: ClaimCaveat[];
}

export const ClaimsAndCaveats: React.FC<ClaimsAndCaveatsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400 mb-3">
        <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
        <span>Claims, Facts & Opinions</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const typeLower = (item.type || '').toLowerCase();
          const badgeColor =
            typeLower.includes('fact')
              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : typeLower.includes('opinion')
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';

          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-stone-50/50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/70"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                  {item.type || 'Claim'}
                </span>
                <span className="text-xs font-medium text-stone-900 dark:text-stone-100">
                  {item.claim}
                </span>
              </div>
              {item.caveat && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pl-1">
                  <span className="font-medium text-stone-700 dark:text-stone-300">Context / Caveat: </span>
                  {item.caveat}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
