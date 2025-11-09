import React from 'react';

interface SuggestionItem {
  label: string;
  icon: string;
  description: string;
}

const SUGGESTIONS: SuggestionItem[] = [
  { label: '3-Day Full Body', icon: '💪', description: 'Perfect for beginners' },
  { label: 'Time-Crunched Plan', icon: '⏰', description: '30-min efficient workouts' },
  { label: 'Minimal Equipment', icon: '🏠', description: 'Train anywhere' },
  { label: 'Upper/Lower Split', icon: '🎯', description: '4-day intermediate plan' },
];

export const SuggestionsStrip: React.FC<{ onSelect?: (label: string) => void }> = ({ onSelect }) => {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-4">
        Not sure where to start?
      </h2>
      
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide snap-x snap-mandatory">
        {SUGGESTIONS.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect?.(item.label)}
            className="flex-shrink-0 snap-start bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 w-48 text-left transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-white text-sm mb-1">{item.label}</div>
            <div className="text-xs text-zinc-500">{item.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
