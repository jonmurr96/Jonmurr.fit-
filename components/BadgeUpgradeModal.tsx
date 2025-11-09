import { EarnedBadge, BadgeTier } from '../types';

interface BadgeUpgradeModalProps {
  badge: EarnedBadge | null;
  fromTier: BadgeTier;
  toTier: BadgeTier;
  onClose: () => void;
}

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  diamond: '#b9f2ff',
};

const TIER_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

export default function BadgeUpgradeModal({ badge, fromTier, toTier, onClose }: BadgeUpgradeModalProps) {
  if (!badge) return null;

  const tierDef = badge.tiers.find(t => t.tier === toTier);
  const xpReward = tierDef?.xpReward || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Confetti Background Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-100 via-transparent to-blue-100 opacity-30 animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Badge Upgraded!</h2>
          <p className="text-gray-600 mb-6">You've leveled up your achievement</p>

          {/* Badge Icon with Tier Upgrade Animation */}
          <div className="mb-6 relative">
            <div className="text-8xl mb-4 transform hover:scale-110 transition-transform">{badge.icon}</div>
            
            {/* Tier Upgrade Indicator */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div 
                className="px-4 py-2 rounded-lg font-bold text-white shadow-lg"
                style={{ backgroundColor: TIER_COLORS[fromTier] }}
              >
                {TIER_LABELS[fromTier]}
              </div>
              <div className="text-3xl">→</div>
              <div 
                className="px-4 py-2 rounded-lg font-bold text-white shadow-lg animate-pulse"
                style={{ backgroundColor: TIER_COLORS[toTier] }}
              >
                {TIER_LABELS[toTier]}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800">{badge.name}</h3>
            <p className="text-gray-600 mt-2">{badge.description}</p>
          </div>

          {/* XP Reward */}
          {xpReward > 0 && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Tier Upgrade Bonus</p>
              <p className="text-3xl font-bold text-purple-600">+{xpReward} XP</p>
            </div>
          )}

          {/* Progress Info */}
          {badge.tierProgressPct < 100 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Progress to {TIER_LABELS[badge.tiers[badge.tiers.findIndex(t => t.tier === toTier) + 1]?.tier || 'Max']} Tier
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${badge.tierProgressPct}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(badge.tierProgressPct)}%</p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
