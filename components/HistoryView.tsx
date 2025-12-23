import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Trash2, Eye } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onClear: () => void;
  onItemClick: (item: HistoryItem) => void;
  onItemSwipeRight: (item: HistoryItem) => void;
  onDeleteItem: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClear,
  onItemClick,
  onItemSwipeRight,
  onDeleteItem
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setSwipingItemId(itemId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingItemId) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Only track horizontal swipes (vertical deviation < 40px)
    if (deltaY < 40) {
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = (item: HistoryItem) => {
    const absOffset = Math.abs(swipeOffset);

    // Right swipe (navigate to variations)
    if (swipeOffset > 80) {
      onItemSwipeRight(item);
    }
    // Left swipe (delete)
    else if (swipeOffset < -80) {
      onDeleteItem(item);
    }
    // Tap (if minimal swipe)
    else if (absOffset < 10) {
      onItemClick(item);
    }

    // Reset state
    setSwipeOffset(0);
    setSwipingItemId(null);
  };

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
          history.map((item) => {
            const isSwiping = swipingItemId === item.id;
            const offset = isSwiping ? swipeOffset : 0;
            const showRightIndicator = offset > 20;
            const showLeftIndicator = offset < -20;
            const indicatorOpacity = Math.min(Math.abs(offset) / 80, 1);

            return (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl"
              >
                {/* Background indicators */}
                {showRightIndicator && (
                  <div
                    className="absolute inset-0 bg-blue-500 flex items-center justify-start px-6"
                    style={{ opacity: indicatorOpacity }}
                  >
                    <Eye size={24} className="text-white" />
                  </div>
                )}
                {showLeftIndicator && (
                  <div
                    className="absolute inset-0 bg-red-500 flex items-center justify-end px-6"
                    style={{ opacity: indicatorOpacity }}
                  >
                    <Trash2 size={24} className="text-white" />
                  </div>
                )}

                {/* Swipeable item */}
                <div
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(item)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 select-none transition-transform"
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
