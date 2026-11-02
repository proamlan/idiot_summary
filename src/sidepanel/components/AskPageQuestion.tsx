import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { PageQuestionAnswer } from '../../shared/types';

interface AskPageQuestionProps {
  onAsk: (question: string) => Promise<PageQuestionAnswer>;
  isLoading: boolean;
}

const SAMPLE_QUESTIONS = [
  "What is the author's main argument?",
  "What are the disadvantages?",
  "Explain the mathematics/logic simply",
  "Is this an opinion or backed by evidence?",
];

export const AskPageQuestion: React.FC<AskPageQuestionProps> = ({ onAsk, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<PageQuestionAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (qText?: string) => {
    const targetQ = (qText || question).trim();
    if (!targetQ || isLoading) return;

    setError(null);
    try {
      const res = await onAsk(targetQ);
      setHistory((prev) => [res, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to get answer.');
    }
  };

  return (
    <section className="p-4 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-stone-400">
        <Sparkles className="w-3.5 h-3.5 text-chai-600 dark:text-chai-400" />
        <span>Ask A Question About This Page</span>
      </div>

      {/* Suggested quick chips */}
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSubmit(sq)}
            disabled={isLoading}
            className="text-[10px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition text-left"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-1.5"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything grounded in this article..."
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-chai-500"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="p-2 rounded-lg bg-chai-600 text-white hover:bg-chai-700 disabled:opacity-40 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer list */}
      {history.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          {history.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/80 space-y-1">
              <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                Q: {item.question}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
              {!item.groundedInSource && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                  ⚠️ Note: Not mentioned in this source page.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
