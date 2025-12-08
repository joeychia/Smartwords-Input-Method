import React from 'react';
import { UserSettings } from '../types';
import { Check, Settings as SettingsIcon } from 'lucide-react';

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

         {/* Info Section */}
         <section className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-start space-x-3">
                <SettingsIcon size={20} className="text-indigo-500 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-indigo-900 text-sm">How VIM Works</h4>
                    <p className="text-indigo-700/80 text-xs mt-1 leading-relaxed">
                        VoiceFlow works with the custom keyboard extension. 
                        Selections made here are saved to the App Group container and auto-pasted by the keyboard when you switch back.
                    </p>
                </div>
            </div>
         </section>

      </div>
    </div>
  );
};