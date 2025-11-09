import React, { useState } from 'react';
import { GamificationState, ExtendedLevelInfo, UnlockedLoot, EarnedBadge } from '../types';
import { ALL_BADGES } from '../utils/gamification';
import { TrophyIcon, FireIcon, SparklesIcon } from '../components/Icons';

interface GamificationScreenProps {
  gamificationData: GamificationState;
  levelInfo: ExtendedLevelInfo;
  lootInventory: UnlockedLoot[];
}

export const GamificationScreen: React.FC<GamificationScreenProps> = ({
  gamificationData,
  levelInfo,
  lootInventory,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'challenges' | 'loot'>('overview');

  // Calculate XP progress: current XP in level vs XP needed for next level
  const xpInCurrentLevel = gamificationData.xp - levelInfo.levelMinXp;
  const xpProgress = (xpInCurrentLevel / levelInfo.xpForNext) * 100;
  const earnedBadgeIds = new Set(gamificationData.earnedBadges.map(b => b.id));

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 pt-4 px-4">
      {/* Header with Level Info */}
      <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-6 mb-6 border border-green-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Level {levelInfo.numericLevel}</h1>
            <p className="text-green-200 text-lg">{levelInfo.rankTitle}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{gamificationData.xp}</div>
            <div className="text-sm text-green-300">Total XP</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-300">{xpInCurrentLevel} XP</span>
            <span className="text-green-300">{levelInfo.xpForNext} XP</span>
          </div>
          <div className="h-4 bg-zinc-800 rounded-full overflow-hidden border border-green-700">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        <div className="text-center text-sm text-green-300 mt-2">
          {levelInfo.xpForNext - xpInCurrentLevel} XP until Level {levelInfo.numericLevel + 1}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Overview', icon: '📊' },
          { id: 'badges' as const, label: 'Badges', icon: '🏆' },
          { id: 'challenges' as const, label: 'Challenges', icon: '🎯' },
          { id: 'loot' as const, label: 'Loot', icon: '🎁' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === tab.id
                ? 'bg-green-500 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-4">
          {/* Streaks */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FireIcon className="w-6 h-6 mr-2 text-orange-500" />
              Streaks
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(gamificationData.streaks) as [string, { current: number; longest: number; lastLogDate: string }][]).map(([type, streak]) => (
                <div key={type} className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className="text-sm text-zinc-400 capitalize mb-1">{type}</div>
                  <div className="text-2xl font-bold text-white">{streak.current}</div>
                  <div className="text-xs text-green-400">Best: {streak.longest}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks Unlocked */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2 text-yellow-500" />
              Active Perks
            </h3>
            {levelInfo.perksUnlocked.length > 0 ? (
              <div className="space-y-2">
                {levelInfo.perksUnlocked.map((perk, idx) => (
                  <div key={idx} className="flex items-center bg-zinc-800 rounded-lg p-3">
                    <span className="text-yellow-400 mr-2">✨</span>
                    <span className="text-sm text-white">{perk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No perks unlocked yet. Keep leveling up!</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-4 border border-blue-700">
              <div className="text-3xl font-bold text-blue-300">{gamificationData.earnedBadges.length}</div>
              <div className="text-sm text-blue-200">Badges Earned</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-xl p-4 border border-purple-700">
              <div className="text-3xl font-bold text-purple-300">{lootInventory.length}</div>
              <div className="text-sm text-purple-200">Items Unlocked</div>
            </div>
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {selectedTab === 'badges' && (
        <div className="space-y-4">
          {Object.entries(
            ALL_BADGES.reduce((acc, badge) => {
              const category = badge.category;
              if (!acc[category]) acc[category] = [];
              acc[category].push(badge);
              return acc;
            }, {} as Record<string, typeof ALL_BADGES>)
          ).map(([category, badges]) => (
            <div key={category} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-lg font-bold mb-3 text-green-400">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-lg p-3 border transition-all ${
                        isEarned
                          ? 'bg-gradient-to-br from-yellow-900 to-yellow-950 border-yellow-700'
                          : 'bg-zinc-800 border-zinc-700 opacity-40'
                      }`}
                    >
                      <div className="text-3xl mb-2 text-center">{badge.icon}</div>
                      <div className={`text-sm font-bold text-center mb-1 ${isEarned ? 'text-yellow-300' : 'text-zinc-500'}`}>
                        {badge.name}
                      </div>
                      <div className={`text-xs text-center ${isEarned ? 'text-yellow-200' : 'text-zinc-600'}`}>
                        {badge.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Challenges Tab */}
      {selectedTab === 'challenges' && (
        <div className="space-y-4">
          {gamificationData.challenges.map((challenge) => {
            const progress = (challenge.progress / challenge.goal) * 100;
            const isCompleted = challenge.isCompleted;

            return (
              <div
                key={challenge.id}
                className={`rounded-xl p-4 border ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-900 to-green-950 border-green-700'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className={`font-bold ${isCompleted ? 'text-green-300' : 'text-white'}`}>
                      {challenge.title}
                    </h4>
                    <p className={`text-sm ${isCompleted ? 'text-green-200' : 'text-zinc-400'}`}>
                      {challenge.description}
                    </p>
                  </div>
                  {isCompleted && <span className="text-2xl">✅</span>}
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isCompleted ? 'text-green-300' : 'text-zinc-400'}>
                      {challenge.progress} / {challenge.goal}
                    </span>
                    <span className={isCompleted ? 'text-green-300' : 'text-zinc-400'}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={isCompleted ? 'text-green-300' : 'text-yellow-400'}>
                    +{challenge.xpReward} XP
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    challenge.period === 'weekly'
                      ? 'bg-blue-500/20 text-blue-300'
                      : challenge.period === 'monthly'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {challenge.period}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loot Tab */}
      {selectedTab === 'loot' && (
        <div>
          {lootInventory.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {lootInventory.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 border ${
                    item.rarity === 'legendary'
                      ? 'bg-gradient-to-br from-yellow-900 to-orange-950 border-yellow-600'
                      : item.rarity === 'epic'
                      ? 'bg-gradient-to-br from-purple-900 to-purple-950 border-purple-600'
                      : item.rarity === 'rare'
                      ? 'bg-gradient-to-br from-blue-900 to-blue-950 border-blue-600'
                      : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-white text-lg">{item.name}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            item.rarity === 'legendary'
                              ? 'bg-yellow-500 text-black'
                              : item.rarity === 'epic'
                              ? 'bg-purple-500 text-white'
                              : item.rarity === 'rare'
                              ? 'bg-blue-500 text-white'
                              : 'bg-zinc-600 text-white'
                          }`}
                        >
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{item.description}</p>
                      <div className="text-xs text-zinc-400">Type: {item.type}</div>
                    </div>
                    <div className="text-4xl ml-4">🎁</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2 text-white">No Items Yet</h3>
              <p className="text-zinc-400">
                Level up to unlock mystery chests and collect exclusive rewards!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
