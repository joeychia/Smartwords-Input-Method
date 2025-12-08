import React from 'react';
import { HistoryItem } from '../types';
import { Trash2, Copy } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onClear: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <h2 className="text-2xl font-bold text-slate-800">History</h2>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
            title="Clear History"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p>No history yet.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex space-x-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-slate-800 font-medium mb-2">{item.selected}</p>
              <div className="pt-2 border-t border-slate-50 mt-2">
                 <p className="text-xs text-slate-400 truncate">Orig: {item.original}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
