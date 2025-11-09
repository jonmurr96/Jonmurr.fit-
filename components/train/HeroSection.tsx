import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <div className="text-center mb-8 relative">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
        <span className="text-2xl">🔥</span>
        Ready to Build Your Plan?
      </h1>
      <p className="text-zinc-400 text-sm md:text-base px-4">
        Let AI guide you — or take full control.
      </p>
      
      <div className="relative mt-6 mx-auto max-w-xs h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 via-green-400/60 to-green-500/40 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent w-1/3 animate-shimmer-slow"></div>
      </div>
    </div>
  );
};
