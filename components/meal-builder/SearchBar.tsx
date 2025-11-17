import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearching?: boolean;
  showQuickPicks?: boolean;
  includeBranded?: boolean;
  onToggleBranded?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search USDA database (1000+ foods)...",
  isSearching = false,
  showQuickPicks = true,
  includeBranded = false,
  onToggleBranded,
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {!showQuickPicks && onToggleBranded && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Searching USDA database - all nutrition values per 100g</span>
          </div>
          <button
            onClick={onToggleBranded}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              includeBranded
                ? 'bg-orange-500 text-white'
                : 'bg-green-500 text-black'
            }`}
          >
            {includeBranded ? '🍔 All Foods' : '🥗 Whole Foods'}
          </button>
        </div>
      )}

      {showQuickPicks && (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Showing quick picks - Type to search 1000+ USDA foods</span>
        </div>
      )}
    </div>
  );
};
