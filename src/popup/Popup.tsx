import React, { useState, useEffect } from 'react';
import { Coffee, Settings, Sparkles, ChevronRight, Globe, Check } from 'lucide-react';
import { ExplanationMode, ExtensionSettings } from '../shared/types';
import { EXPLANATION_MODES, MODEL_REGISTRY } from '../shared/constants';
import { getSettings, saveSettings } from '../storage/settings-storage';
import { extractDomain } from '../shared/utils';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [tab, setTab] = useState<{ id?: number; url?: string; title?: string; favIconUrl?: string }>({});
  const [selectedMode, setSelectedMode] = useState<ExplanationMode>('eli12');
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setSelectedMode(s.defaultMode || 'eli12');
    });

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
        if (activeTab) {
          setTab({
            id: activeTab.id,
            url: activeTab.url,
            title: activeTab.title,
            favIconUrl: activeTab.favIconUrl,
          });
        }
      });
    }
  }, []);

  const handleModeSelect = async (mode: ExplanationMode) => {
    setSelectedMode(mode);
    if (settings) {
      await saveSettings({ defaultMode: mode });
    }
  };

  const handleExplain = async () => {
    if (!tab.id || isTriggering) return;
    setIsTriggering(true);

    try {
      // 1. Open the Chrome Side Panel for the active tab or current window
      if (typeof chrome !== 'undefined' && chrome.sidePanel) {
        try {
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch {
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (currentTab?.windowId) {
            await chrome.sidePanel.open({ windowId: currentTab.windowId });
          }
        }
      }

      // 2. Notify Side Panel to trigger explanation immediately
      chrome.runtime.sendMessage({
        type: 'TRIGGER_EXPLAIN_ACTIVE_TAB',
        tabId: tab.id,
        mode: selectedMode,
      });

      // 3. Close the popup cleanly
      setTimeout(() => {
        window.close();
      }, 150);
    } catch (err) {
      console.error('Failed to open side panel from popup:', err);
      setIsTriggering(false);
    }
  };

  const handleOpenSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('settings.html', '_blank');
    }
  };

  const domain = tab.url ? extractDomain(tab.url) : 'Current Page';
  const currentModel = MODEL_REGISTRY.find((m) => m.id === settings?.primaryModel) || {
    name: settings?.primaryModel || 'Nemotron 3.5 Lightning',
  };

  return (
    <div className="w-[340px] bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-4 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-chai-600 flex items-center justify-center text-white shadow-xs">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Idiot Summary
            </h1>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">
              Simple explanations over chai
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenSettings}
          title="Open Settings"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Current Page Card */}
      <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 mb-1">
          {tab.favIconUrl ? (
            <img src={tab.favIconUrl} alt="" className="w-3.5 h-3.5 rounded-xs" />
          ) : (
            <Globe className="w-3.5 h-3.5" />
          )}
          <span className="font-medium truncate">{domain}</span>
        </div>
        <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 line-clamp-2 leading-snug">
          {tab.title || 'Untitled Webpage'}
        </div>
      </div>

      {/* Explanation Level Selector */}
      <div className="mt-3.5 space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Explanation Level
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {EXPLANATION_MODES.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeSelect(m.id)}
                className={`p-2 rounded-lg text-left border transition text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-chai-500 bg-chai-50/60 dark:bg-chai-950/30 text-chai-950 dark:text-chai-100'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px]">
                    {m.name.replace("Explain Like I'm 12", "ELI12")}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-chai-600" />}
                </div>
                <span className="text-[9px] text-stone-400 mt-0.5 line-clamp-1">
                  {m.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Indicator */}
      <div className="mt-3 flex items-center justify-between text-[11px] px-1 text-stone-500 dark:text-stone-400">
        <span>Provider / Model:</span>
        <button
          type="button"
          onClick={handleOpenSettings}
          className="font-medium text-stone-700 dark:text-stone-300 hover:underline flex items-center gap-1"
        >
          <span className="truncate max-w-[170px]">{currentModel.name}</span>
          <ChevronRight className="w-3 h-3 text-stone-400" />
        </button>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleExplain}
        disabled={isTriggering}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-chai-600 hover:bg-chai-700 active:scale-[0.99] text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Explain This Page</span>
      </button>
    </div>
  );
};
