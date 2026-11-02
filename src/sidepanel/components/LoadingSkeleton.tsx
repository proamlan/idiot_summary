import React from 'react';
import { Coffee, Sparkles } from 'lucide-react';

interface LoadingSkeletonProps {
  stage: 'extracting' | 'summarizing';
  modelName?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ stage, modelName }) => {
  return (
    <div className="p-5 space-y-6 animate-pulse">
      {/* Friendly Status Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 rounded-xl">
        {stage === 'extracting' ? (
          <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
        )}
        <div className="text-xs font-medium text-amber-900 dark:text-amber-200">
          {stage === 'extracting' ? (
            <span>Extracting main article & removing web clutter...</span>
          ) : (
            <span>Explaining like you're a beginner using {modelName || 'AI'}...</span>
          )}
        </div>
      </div>

      {/* Big Idea Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-stone-200 dark:bg-stone-800 rounded"></div>
        <div className="h-6 w-full bg-stone-200 dark:bg-stone-800 rounded-lg"></div>
        <div className="h-6 w-4/5 bg-stone-200 dark:bg-stone-800 rounded-lg"></div>
      </div>

      {/* Main explanation card */}
      <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/40 space-y-3">
        <div className="h-4 w-36 bg-stone-200 dark:bg-stone-700 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-stone-200 dark:bg-stone-700 rounded"></div>
          <div className="h-4 w-full bg-stone-200 dark:bg-stone-700 rounded"></div>
          <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded"></div>
        </div>
      </div>

      {/* Key points skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 shrink-0"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-1/3 bg-stone-200 dark:bg-stone-800 rounded"></div>
              <div className="h-3.5 w-full bg-stone-200 dark:bg-stone-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
