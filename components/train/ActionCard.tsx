import React from 'react';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  isPrimary?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  subtitle, 
  icon, 
  onClick, 
  isPrimary = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/50
        ${isPrimary 
          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-black shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50' 
          : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
        }`}
    >
      {isPrimary && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 animate-shimmer"></div>
        </div>
      )}
      
      <div className="relative z-10 flex items-start gap-4">
        <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${isPrimary ? 'bg-black/20' : 'bg-white/10'}`}>
          <div className="w-8 h-8">{icon}</div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg mb-1 ${isPrimary ? 'text-black' : 'text-white'}`}>
            {title}
          </h3>
          <p className={`text-sm line-clamp-2 ${isPrimary ? 'text-black/70' : 'text-zinc-400'}`}>
            {subtitle}
          </p>
        </div>
      </div>
      
      {!isPrimary && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300"></div>
      )}
    </button>
  );
};
