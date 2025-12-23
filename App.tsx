import React, { useState, useEffect } from 'react';
import { Mic, Clock, Settings, FileText, Bug, Globe, AlertCircle } from 'lucide-react';
import { AppView, HistoryItem, RewriteVariant, UserSettings } from './types';
import { DictationView } from './components/DictationView';
import { RewriteView } from './components/RewriteView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { getHistory, saveHistoryItem, clearHistory, getSettings, saveSettings, savePendingTextForKeyboard } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DICTATION);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [tempTranscript, setTempTranscript] = useState<string>('');
  const [tempVariants, setTempVariants] = useState<RewriteVariant[]>([]);
  const [backendStatus, setBackendStatus] = useState<'debug' | 'prod' | 'unavailable'>('unavailable');

  useEffect(() => {
    const host = window.location.hostname;
    if (host.includes('10.') || host === 'localhost' || host === '127.0.0.1') {
      setBackendStatus('debug');
    } else if (host.includes('github.io')) {
      setBackendStatus('prod');
    } else {
      setBackendStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSettingsUpdate = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDictationFinish = (transcript: string) => {
    setTempTranscript(transcript);
    setCurrentView(AppView.REWRITE);
  };

  const handleVariantSelect = (variant: RewriteVariant) => {
    // 1. Create History Item
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      original: tempTranscript,
      selected: variant.text,
      timestamp: Date.now(),
      tags: [variant.label],
      variants: tempVariants // Save the cache!
    };

    // 2. Save to Local History
    saveHistoryItem(newItem);
    setHistory(getHistory());

    // 3. Save to "App Group" for Keyboard to pick up
    savePendingTextForKeyboard(variant.text);

    // 4. Reset View
    setCurrentView(AppView.DICTATION);

    // 5. Show Feedback (Mocking iOS Toast)
    const toast = document.createElement('div');
    toast.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex flex-col items-center animate-fade-in";
    toast.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2"><polyline points="20 6 9 17 4 12"></polyline></svg><span class="font-medium">Saved</span><span class="text-xs text-gray-300 mt-1">Switch to keyboard to insert</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleHistoryItemSelect = (item: HistoryItem) => {
    // Tap-to-copy: Save to App Group
    savePendingTextForKeyboard(item.selected);

    // Show Feedback Toast
    const toast = document.createElement('div');
    toast.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex flex-col items-center animate-fade-in";
    toast.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2"><polyline points="20 6 9 17 4 12"></polyline></svg><span class="font-medium">Saved</span><span class="text-xs text-gray-300 mt-1">Ready to insert</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  };

  const handleHistoryItemRewrite = (item: HistoryItem) => {
    // Long-press: Re-open Rewrite View with original transcript AND cached variants
    setTempTranscript(item.original);
    setTempVariants(item.variants || []);
    setCurrentView(AppView.REWRITE);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DICTATION:
        return <DictationView onFinish={handleDictationFinish} language={settings.language} />;
      case AppView.REWRITE:
        return (
          <RewriteView
            rawTranscript={tempTranscript}
            initialVariants={tempVariants}
            contextHistory={history}
            tone={settings.tone}
            geminiApiKey={settings.geminiApiKey}
            onSelect={handleVariantSelect}
            onVariantsGenerated={setTempVariants}
            onBack={() => setCurrentView(AppView.DICTATION)}
          />
        );
      case AppView.HISTORY:
        return (
          <HistoryView
            history={history}
            onClear={() => { clearHistory(); setHistory([]); }}
            onItemClick={handleHistoryItemSelect}
            onItemLongPress={handleHistoryItemRewrite}
          />
        );
      case AppView.SETTINGS:
        return <SettingsView settings={settings} onUpdate={handleSettingsUpdate} />;
      default:
        return <DictationView onFinish={handleDictationFinish} language={settings.language} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 relative overflow-hidden font-sans">

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {currentView !== AppView.REWRITE && (
        <nav className="h-20 bg-white border-t border-slate-200 flex items-start justify-around pt-3 pb-6 shrink-0 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => setCurrentView(AppView.HISTORY)}
            className={`flex flex-col items-center space-y-1 w-16 ${currentView === AppView.HISTORY ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Clock size={24} strokeWidth={currentView === AppView.HISTORY ? 2.5 : 2} />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.DICTATION)}
            className="flex flex-col items-center -mt-8"
          >
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all
              ${currentView === AppView.DICTATION
                ? 'bg-indigo-600 text-white shadow-indigo-200 scale-110'
                : 'bg-white text-indigo-600 border border-slate-100'}
            `}>
              <Mic size={28} fill={currentView === AppView.DICTATION ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-medium mt-2 text-indigo-600">Dictate</span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.SETTINGS)}
            className={`flex flex-col items-center space-y-1 w-16 relative ${currentView === AppView.SETTINGS ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <div className="relative">
              <Settings size={24} strokeWidth={currentView === AppView.SETTINGS ? 2.5 : 2} />
              <div className="absolute -top-1 -right-1">
                {backendStatus === 'debug' && <Bug size={10} className="text-amber-500 fill-amber-500 animate-pulse" />}
                {backendStatus === 'prod' && <Globe size={10} className="text-emerald-500 fill-emerald-500" />}
                {backendStatus === 'unavailable' && <AlertCircle size={10} className="text-rose-500 fill-rose-500" />}
              </div>
            </div>
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;