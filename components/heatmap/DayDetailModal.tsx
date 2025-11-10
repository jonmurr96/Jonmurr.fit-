import React from 'react';
import { HeatMapDay } from '../../services/database/heatMapService';
import { XMarkIcon, FireIcon, BeakerIcon } from '../Icons';

interface DayDetailModalProps {
  day: HeatMapDay;
  onClose: () => void;
}

const WaterDropIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, onClose }) => {
  const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const hasWorkout = day.workout_logged;
  const hasMeal = day.meals_logged >= 2;
  const hasWater = day.water_intake_oz > 0;
  const waterGoalMet = day.water_goal_met;

  const getActivityLevelText = () => {
    if (day.is_rest_day) return 'Rest Day';
    if (day.level === 'perfect') return 'Perfect Day!';
    if (day.level === 'complete') return 'Complete';
    if (day.level === 'moderate') return 'Good Progress';
    if (day.level === 'low') return 'Partial';
    return 'No Activity';
  };

  const getActivityLevelColor = () => {
    if (day.is_rest_day) return 'text-blue-400';
    if (day.level === 'perfect' || day.level === 'complete') return 'text-green-400';
    if (day.level === 'moderate') return 'text-green-400';
    if (day.level === 'low') return 'text-orange-400';
    return 'text-zinc-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border-2 border-zinc-800 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{formattedDate}</h3>
            <p className={`text-sm font-semibold ${getActivityLevelColor()}`}>
              {getActivityLevelText()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <FireIcon className="w-6 h-6 text-blue-400" />
              <h4 className="font-semibold">Workouts</h4>
            </div>
            {hasWorkout ? (
              <div className="space-y-2">
                <p className="text-zinc-300">
                  <span className="font-bold text-blue-400">Workout</span> completed
                </p>
              </div>
            ) : (
              <p className="text-zinc-500">No workouts logged</p>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BeakerIcon className="w-6 h-6 text-orange-400" />
              <h4 className="font-semibold">Nutrition</h4>
            </div>
            {hasMeal ? (
              <div className="space-y-2">
                <p className="text-zinc-300">
                  <span className="font-bold text-orange-400">{day.meals_logged}</span> meal{day.meals_logged > 1 ? 's' : ''} logged
                </p>
                {day.hit_macros && (
                  <p className="text-green-400 text-sm font-semibold">✓ Macro goals met</p>
                )}
                {day.hit_protein_goal && (
                  <p className="text-green-400 text-sm font-semibold">✓ Protein goal met</p>
                )}
              </div>
            ) : (
              <p className="text-zinc-500">No meals logged</p>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <WaterDropIcon className="w-6 h-6 text-cyan-400" />
              <h4 className="font-semibold">Hydration</h4>
            </div>
            {hasWater ? (
              <div className="space-y-2">
                <p className="text-zinc-300">
                  <span className="font-bold text-cyan-400">{Math.round(day.water_intake_oz / 8)}</span> glasses logged
                </p>
                {waterGoalMet ? (
                  <p className="text-green-400 text-sm font-semibold">✓ Daily water goal met</p>
                ) : (
                  <p className="text-zinc-500 text-sm">Keep hydrating!</p>
                )}
              </div>
            ) : (
              <p className="text-zinc-500">No water logged</p>
            )}
          </div>

          {day.is_rest_day && (
            <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4 text-center">
              <p className="text-blue-400 font-semibold">🌙 Designated Rest Day</p>
              <p className="text-zinc-400 text-sm mt-1">Recovery is progress too!</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
