import React from 'react';
import { UserSettings } from '../types';
import { Check, Settings as SettingsIcon, Globe, Bug, Zap } from 'lucide-react';
import { setEnvironmentPreference } from '../services/storageService';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdate: (newSettings: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {

  const update = (key: keyof UserSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 py-5 bg-white border-b border-slate-100 sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
      </div>

      <div className="p-6 space-y-8 pb-24 overflow-y-auto">

        {/* Tone Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">AI Personality</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {['natural', 'formal', 'casual'].map((tone) => (
              <button
                key={tone}
                onClick={() => update('tone', tone)}
                className={`w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors`}
              >
                <span className="capitalize text-slate-700 font-medium">{tone}</span>
                {settings.tone === tone && <Check size={18} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </section>

        {/* Language Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Input Language</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {[
              { id: 'mixed', label: 'Mixed (ZH/EN)' },
              { id: 'zh', label: 'Chinese Only' },
              { id: 'en', label: 'English Only' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => update('language', lang.id)}
                className={`w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors`}
              >
                <span className="text-slate-700 font-medium">{lang.label}</span>
                {settings.language === lang.id && <Check size={18} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </section>

        {/* App Environment Section */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">App Environment</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden grid grid-cols-3 p-1">
            {[
              { id: 'auto', label: 'Auto', icon: Zap },
              { id: 'dev', label: 'Dev', icon: Bug },
              { id: 'prod', label: 'Prod', icon: Globe }
            ].map((env) => {
              const Icon = env.icon;
              const isSelected = settings.preferredEnvironment === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => {
                    update('preferredEnvironment', env.id);
                    setEnvironmentPreference(env.id as 'auto' | 'dev' | 'prod');
                  }}
                  className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{env.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[10px] text-slate-400 italic">
            {settings.preferredEnvironment === 'auto' && "Automatically pings local Mac for development server."}
            {settings.preferredEnvironment === 'dev' && "Locked to local Mac server (10.0.0.131)."}
            {settings.preferredEnvironment === 'prod' && "Locked to GitHub Pages (production)."}
          </p>
        </section>

        {/* API Key Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Gemini API Key</h3>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-600 font-bold hover:underline"
            >
              Get Free Key →
            </a>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-4">
            <input
              type="password"
              value={settings.geminiApiKey || ''}
              onChange={(e) => update('geminiApiKey', e.target.value)}
              placeholder="Enter your API key"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            />
            <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
              Your key is saved locally on this device. It is used to generate smart suggestions and rewrites.
            </p>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-start space-x-3">
            <SettingsIcon size={20} className="text-indigo-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-indigo-900 text-sm">How Smart Words Works</h4>
              <p className="text-indigo-700/80 text-xs mt-1 leading-relaxed">
                Smart Words works with the custom keyboard extension.
                Selections made here are saved to the App Group container and auto-pasted by the keyboard when you switch back.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};