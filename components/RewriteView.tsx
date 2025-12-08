import React, { useEffect, useState } from 'react';
import { generateRewrites } from '../services/geminiService';
import { RewriteVariant, HistoryItem } from '../types';
import { Loader2, Sparkles, Check, ChevronLeft, Send, Copy } from 'lucide-react';

interface RewriteViewProps {
  rawTranscript: string;
  contextHistory: HistoryItem[];
  tone: string;
  onSelect: (variant: RewriteVariant) => void;
  onBack: () => void;
}

export const RewriteView: React.FC<RewriteViewProps> = ({ 
  rawTranscript, 
  contextHistory, 
  tone, 
  onSelect, 
  onBack 
}) => {
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<RewriteVariant[]>([]);
  const startRef = React.useRef<{x:number;y:number;time:number}|null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetch = async () => {
      const results = await generateRewrites(rawTranscript, contextHistory, tone);
      if (isMounted) {
        setVariants(results);
        setLoading(false);
      }
    };
    
    fetch();

    return () => { isMounted = false; };
  }, [rawTranscript, contextHistory, tone]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2 size={48} className="text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">Polishing your thought...</h3>
            <p className="text-slate-500">Analyzing context and style</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-slate-50"
      onTouchStart={(e) => {
        const t = e.touches[0];
        startRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      }}
      onTouchEnd={(e) => {
        const s = startRef.current; if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x; const dy = Math.abs(t.clientY - s.y);
        const dt = Date.now() - s.time;
        if (s.x < 30 && dx > 60 && dy < 40 && dt < 600) {
          onBack();
        }
        startRef.current = null;
      }}
    >
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={24} />
        </button>
        <h2 className="ml-2 text-lg font-semibold text-slate-800">Select Version</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Original */}
        <div className="px-4 py-3 bg-slate-100 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Original</p>
            <p className="text-slate-700">{rawTranscript}</p>
        </div>

        <div className="flex items-center space-x-2 my-4">
            <Sparkles size={16} className="text-indigo-500" />
            <span className="text-sm font-medium text-indigo-600">AI Suggestions</span>
        </div>

        {/* Variants List */}
        <div className="space-y-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className="w-full text-left group bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {variant.label}
                </span>
              </div>
              <p className="text-base text-slate-800 leading-relaxed font-medium">
                {variant.text}
              </p>
              {variant.description && (
                  <p className="mt-2 text-xs text-slate-400">{variant.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
