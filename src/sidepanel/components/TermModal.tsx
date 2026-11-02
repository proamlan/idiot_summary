import React, { useState } from 'react';
import { X, BookMarked, Search, Loader2 } from 'lucide-react';
import { DifficultTerm } from '../../shared/types';

interface TermModalProps {
  term: DifficultTerm | null;
  onClose: () => void;
  onExplainCustomTerm?: (term: string) => Promise<DifficultTerm>;
}

export const TermModal: React.FC<TermModalProps> = ({ term, onClose, onExplainCustomTerm }) => {
  const [customTerm, setCustomTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTerm, setActiveTerm] = useState<DifficultTerm | null>(term);

  if (!term && !activeTerm) return null;
  const current = activeTerm || term;

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTerm.trim() || !onExplainCustomTerm) return;
    setLoading(true);
    try {
      const res = await onExplainCustomTerm(customTerm.trim());
      setActiveTerm(res);
      setCustomTerm('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
          <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
            <BookMarked className="w-4 h-4 text-chai-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Concept Explainer</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {current && (
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {current.term}
              </h3>
              <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300 mt-1.5">
                {current.simple_definition}
              </p>
              {current.example && (
                <div className="p-2.5 mt-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Everyday Analogy: </span>
                  {current.example}
                </div>
              )}
            </div>
          )}

          {/* Quick search another term */}
          {onExplainCustomTerm && (
            <form onSubmit={handleCustomSearch} className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-1.5">
              <input
                type="text"
                value={customTerm}
                onChange={(e) => setCustomTerm(e.target.value)}
                placeholder="Look up another term from page..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
              <button
                type="submit"
                disabled={loading || !customTerm.trim()}
                className="p-1.5 rounded-md bg-stone-800 dark:bg-stone-700 text-white disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
