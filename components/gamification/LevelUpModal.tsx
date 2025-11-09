import React from 'react';
import { UnlockedLoot } from '../../types';

interface LevelUpModalProps {
  oldLevel: number;
  newLevel: number;
  newRank: string;
  perksUnlocked: string[];
  chest?: UnlockedLoot;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  oldLevel,
  newLevel,
  newRank,
  perksUnlocked,
  chest,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-yellow-500 rounded-lg max-w-md w-full p-6 relative animate-scale-in">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>

        <div className="text-center mt-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">LEVEL UP!</h2>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className="text-4xl font-bold text-white">{oldLevel}</span>
            <span className="text-green-400">→</span>
            <span className="text-5xl font-bold text-green-400">{newLevel}</span>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <div className="text-sm text-zinc-400 mb-1">Rank</div>
            <div className="text-2xl font-bold text-yellow-400">{newRank}</div>
          </div>

          {perksUnlocked.length > 0 && (
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <div className="text-sm text-zinc-400 mb-2">New Perks Unlocked</div>
              <div className="space-y-1">
                {perksUnlocked.map((perk, idx) => (
                  <div key={idx} className="text-sm text-green-400 flex items-center justify-center">
                    <span className="mr-2">✨</span>
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          )}

          {chest && (
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-4 mb-4 border border-purple-500">
              <div className="text-2xl mb-2">🎁</div>
              <div className="text-sm text-purple-200 mb-1">Mystery Chest Unlocked!</div>
              <div className="text-lg font-bold text-yellow-300">{chest.name}</div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
