import React from 'react';
import { EarnedBadge } from '../../types';

interface BadgeUnlockModalProps {
  badges: EarnedBadge[];
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badges, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-blue-500 rounded-lg max-w-md w-full p-6 relative animate-scale-in">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="text-8xl animate-bounce">🏆</div>
        </div>

        <div className="text-center mt-8">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">
            {badges.length === 1 ? 'Badge Unlocked!' : 'Badges Unlocked!'}
          </h2>

          <div className="space-y-4 mb-6">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-zinc-800 rounded-lg p-4 border border-blue-500/50 hover:border-blue-500 transition-colors"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="text-xl font-bold text-white mb-1">{badge.name}</div>
                <div className="text-sm text-zinc-400 mb-2">{badge.description}</div>
                <div className="inline-block px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-300">
                  {badge.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};
