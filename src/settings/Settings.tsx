import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Key,
  ShieldAlert,
  Save,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Cpu,
  RotateCcw,
  Trash2,
  Sliders,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { ExtensionSettings, AIProviderType, ExplanationMode, SummaryLength } from '../shared/types';
import { MODEL_REGISTRY, EXPLANATION_MODES, DEFAULT_SETTINGS } from '../shared/constants';
import { getSettings, saveSettings, clearApiKeys } from '../storage/settings-storage';
import { clearHistory } from '../storage/history-storage';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Key visibility toggles
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  // Health check statuses
  const [nvidiaTesting, setNvidiaTesting] = useState(false);
  const [nvidiaStatus, setNvidiaStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const [openRouterTesting, setOpenRouterTesting] = useState(false);
  const [openRouterStatus, setOpenRouterStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveSettings(settings);
      setSaveStatus('Settings saved successfully.');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTestProvider = async (provider: AIProviderType) => {
    const key = provider === 'nvidia' ? settings.nvidiaApiKey : settings.openrouterApiKey;
    const model = provider === 'nvidia' ? settings.primaryModel : settings.fallbackModel;

    if (!key) {
      if (provider === 'nvidia') {
        setNvidiaStatus({ ok: false, message: 'Please enter an NVIDIA API key first.' });
      } else {
        setOpenRouterStatus({ ok: false, message: 'Please enter an OpenRouter API key first.' });
      }
      return;
    }

    if (provider === 'nvidia') {
      setNvidiaTesting(true);
      setNvidiaStatus(null);
    } else {
      setOpenRouterTesting(true);
      setOpenRouterStatus(null);
    }

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'HEALTH_CHECK_PROVIDER',
        provider,
        apiKey: key,
        modelId: model,
      });

      if (provider === 'nvidia') {
        setNvidiaStatus({
          ok: res?.ok,
          message: res?.ok ? `Connected! Latency: ${res.latencyMs}ms` : res?.message || 'Connection failed',
        });
      } else {
        setOpenRouterStatus({
          ok: res?.ok,
          message: res?.ok ? `Connected! Latency: ${res.latencyMs}ms` : res?.message || 'Connection failed',
        });
      }
    } catch (err: any) {
      const msg = err.message || 'Health check failed.';
      if (provider === 'nvidia') {
        setNvidiaStatus({ ok: false, message: msg });
      } else {
        setOpenRouterStatus({ ok: false, message: msg });
      }
    } finally {
      if (provider === 'nvidia') setNvidiaTesting(false);
      else setOpenRouterTesting(false);
    }
  };

  const handleClearKeys = async () => {
    if (confirm('Are you sure you want to remove all saved API keys?')) {
      await clearApiKeys();
      setSettings((prev) => ({
        ...prev,
        nvidiaApiKey: '',
        openrouterApiKey: '',
      }));
      setSaveStatus('API keys cleared.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all reading history?')) {
      await clearHistory();
      setSaveStatus('Reading history cleared.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <Loader2 className="w-6 h-6 animate-spin text-chai-600" />
      </div>
    );
  }

  const nvidiaModels = MODEL_REGISTRY.filter((m) => m.provider === 'nvidia');
  const openRouterModels = MODEL_REGISTRY.filter((m) => m.provider === 'openrouter');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chai-600 flex items-center justify-center text-white shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Idiot Summary Settings</h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure your AI models, API keys, and reading preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-chai-600 hover:bg-chai-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

        {saveStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 text-stone-700 dark:text-stone-300">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4" />
            <span>Local Storage & API Key Security Notice</span>
          </div>
          <p className="leading-relaxed">
            API keys are stored strictly in your browser profile using <code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[10px]">chrome.storage.local</code>.
            They are never sent to any third-party analytics or external server, and only used directly to communicate with NVIDIA NIM and OpenRouter API endpoints from your machine.
          </p>
        </div>

        {/* Section 1: API Keys & Health Checks */}
        <section className="p-5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <Key className="w-4 h-4 text-chai-600" />
            <span>AI Provider API Keys</span>
          </div>

          {/* NVIDIA Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-stone-800 dark:text-stone-200">
                NVIDIA NIM API Key
              </label>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-chai-600 dark:text-chai-400 hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>Get NVIDIA Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showNvidiaKey ? 'text' : 'password'}
                  value={settings.nvidiaApiKey}
                  onChange={(e) => setSettings({ ...settings, nvidiaApiKey: e.target.value })}
                  placeholder="nvapi-..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNvidiaKey(!showNvidiaKey)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showNvidiaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleTestProvider('nvidia')}
                disabled={nvidiaTesting}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition flex items-center gap-1.5"
              >
                {nvidiaTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Test Connection</span>
              </button>
            </div>
            {nvidiaStatus && (
              <div
                className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                  nvidiaStatus.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {nvidiaStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{nvidiaStatus.message}</span>
              </div>
            )}
          </div>

          {/* OpenRouter Key */}
          <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-stone-800 dark:text-stone-200">
                OpenRouter API Key (Supports free models)
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-chai-600 dark:text-chai-400 hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  value={settings.openrouterApiKey}
                  onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleTestProvider('openrouter')}
                disabled={openRouterTesting}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition flex items-center gap-1.5"
              >
                {openRouterTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Test Connection</span>
              </button>
            </div>
            {openRouterStatus && (
              <div
                className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                  openRouterStatus.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {openRouterStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{openRouterStatus.message}</span>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Model Orchestration & Fallback */}
        <section className="p-5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <Cpu className="w-4 h-4 text-chai-600" />
            <span>AI Orchestration & Fallback</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Provider & Model */}
            <div className="space-y-2 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
              <label className="text-xs font-bold uppercase tracking-wider text-chai-700 dark:text-chai-400">
                Primary Model
              </label>
              <div>
                <span className="text-[11px] text-stone-500">Provider:</span>
                <select
                  value={settings.primaryProvider}
                  onChange={(e) => {
                    const p = e.target.value as AIProviderType;
                    const defModel = p === 'nvidia' ? 'nvidia/nemotron-3.5-lightning-30b-a3b' : 'openrouter/free';
                    setSettings({ ...settings, primaryProvider: p, primaryModel: defModel });
                  }}
                  className="w-full text-xs mt-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                >
                  <option value="nvidia">NVIDIA NIM</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-stone-500">Model:</span>
                <select
                  value={settings.primaryModel}
                  onChange={(e) => setSettings({ ...settings, primaryModel: e.target.value })}
                  className="w-full text-xs mt-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                >
                  {(settings.primaryProvider === 'nvidia' ? nvidiaModels : openRouterModels).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fallback Provider & Model */}
            <div className="space-y-2 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Fallback Model (On Error/Rate-Limit)
              </label>
              <div>
                <span className="text-[11px] text-stone-500">Provider:</span>
                <select
                  value={settings.fallbackProvider}
                  onChange={(e) => {
                    const p = e.target.value as AIProviderType;
                    const defModel = p === 'nvidia' ? 'nvidia/nemotron-3.5-lightning-30b-a3b' : 'openrouter/free';
                    setSettings({ ...settings, fallbackProvider: p, fallbackModel: defModel });
                  }}
                  className="w-full text-xs mt-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="nvidia">NVIDIA NIM</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-stone-500">Model:</span>
                <select
                  value={settings.fallbackModel}
                  onChange={(e) => setSettings({ ...settings, fallbackModel: e.target.value })}
                  className="w-full text-xs mt-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                >
                  {(settings.fallbackProvider === 'nvidia' ? nvidiaModels : openRouterModels).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Preferences */}
        <section className="p-5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <Sliders className="w-4 h-4 text-chai-600" />
            <span>Explanation Preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Default Explanation Mode
              </label>
              <select
                value={settings.defaultMode}
                onChange={(e) => setSettings({ ...settings, defaultMode: e.target.value as ExplanationMode })}
                className="w-full text-xs mt-1.5 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                {EXPLANATION_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Maximum Summary Length
              </label>
              <select
                value={settings.maxSummaryLength}
                onChange={(e) => setSettings({ ...settings, maxSummaryLength: e.target.value as SummaryLength })}
                className="w-full text-xs mt-1.5 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                <option value="concise">Concise (Fast & focused)</option>
                <option value="standard">Standard (Balanced overview)</option>
                <option value="comprehensive">Comprehensive (Full detail)</option>
              </select>
            </div>
          </div>

          {/* Reading History toggle */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Save Reading History
              </div>
              <div className="text-[11px] text-stone-500">
                Store summarized articles locally in your browser for easy re-reading.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(e) => setSettings({ ...settings, historyEnabled: e.target.checked })}
              className="w-4 h-4 text-chai-600 rounded border-stone-300 focus:ring-chai-500 cursor-pointer"
            />
          </div>
        </section>

        {/* Section 4: Data & Reset Actions */}
        <section className="p-5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Data Management
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Reading History</span>
            </button>
            <button
              type="button"
              onClick={handleClearKeys}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Stored API Keys</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
