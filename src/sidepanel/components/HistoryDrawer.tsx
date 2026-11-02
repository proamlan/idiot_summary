import React from 'react';
import { X, Trash2, Calendar, Cpu } from 'lucide-react';
import { HistoryItem } from '../../shared/types';
import { formatDate } from '../../shared/utils';

interface HistoryDrawerProps {
  isOpen: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  history,
  onClose,
  onSelectHistoryItem,
  onDeleteItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Reading History
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {history.length} summarized pages stored locally
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No reading history yet. Summarize pages to see them here.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-chai-300 dark:hover:border-chai-800 bg-stone-50/50 dark:bg-stone-800/30 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-chai-600 transition">
                      {item.title}
                    </h3>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {item.domain}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete entry"
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className="cursor-pointer text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-1.5 leading-snug"
                >
                  {item.bigIdea}
                </p>

                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[9px] uppercase">
                    <Cpu className="w-3 h-3" />
                    <span>{item.model.split('/').pop()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              Clear All History
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
