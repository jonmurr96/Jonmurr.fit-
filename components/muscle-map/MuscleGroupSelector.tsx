import { useState } from 'react';
import { MuscleGroup } from '../../types';
import { muscleGroupConfigs, RecoveryStatus, getRecoveryColor, getRecoveryLabel } from '../../utils/muscleMapping';

export interface MuscleData {
  muscleGroup: MuscleGroup;
  lastTrained: Date | null;
  intensity?: number;
}

interface MuscleGroupSelectorProps {
  muscleData: MuscleData[];
  selectedMuscles?: MuscleGroup[];
  onMuscleToggle?: (muscle: MuscleGroup) => void;
  onMuscleClick?: (muscle: MuscleGroup) => void;
  mode?: 'select' | 'view';
  title?: string;
  showStats?: boolean;
}

export const MuscleGroupSelector = ({
  muscleData,
  selectedMuscles = [],
  onMuscleToggle,
  onMuscleClick,
  mode = 'view',
  title = 'PICK YOUR TARGET AREAS',
  showStats = true,
}: MuscleGroupSelectorProps) => {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  const getMuscleRecoveryStatus = (muscle: MuscleGroup): RecoveryStatus => {
    const data = muscleData.find(m => m.muscleGroup === muscle);
    if (!data || !data.lastTrained) {
      return 'stale';
    }

    const hoursSince = (Date.now() - data.lastTrained.getTime()) / (1000 * 60 * 60);
    const config = muscleGroupConfigs[muscle];
    
    if (hoursSince >= config.recoveryHours + 168) {
      return 'stale';
    } else if (hoursSince >= config.recoveryHours) {
      return 'fresh';
    } else if (hoursSince >= config.recoveryHours / 2) {
      return 'recovering';
    } else {
      return 'trained';
    }
  };

  const getMuscleColor = (muscle: MuscleGroup): string => {
    const status = getMuscleRecoveryStatus(muscle);
    return getRecoveryColor(status);
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    if (mode === 'select') {
      onMuscleToggle?.(muscle);
    } else {
      onMuscleClick?.(muscle);
    }
  };

  const isSelected = (muscle: MuscleGroup) => {
    return selectedMuscles.includes(muscle);
  };

  const daysSinceLastWorkout = muscleData.length > 0
    ? Math.floor(
        Math.min(...muscleData.map(m => 
          m.lastTrained ? (Date.now() - m.lastTrained.getTime()) / (1000 * 60 * 60 * 24) : 999
        ))
      )
    : 0;

  const freshMuscleCount = muscleData.filter(m => getMuscleRecoveryStatus(m.muscleGroup) === 'fresh').length;

  // Muscle icons mapping (using emoji for now, can be replaced with SVG icons)
  const muscleIcons: Record<MuscleGroup, string> = {
    chest: '💪',
    shoulders: '🏋️',
    lats: '🦾',
    biceps: '💪',
    triceps: '💪',
    abs: '🔥',
    obliques: '🔥',
    quads: '🦵',
    hamstrings: '🦵',
    glutes: '🍑',
    calves: '🦵',
    traps: '🦾',
    lower_back: '🦾',
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stats Header */}
      {showStats && mode === 'view' && (
        <div className="mb-8 flex justify-center gap-12">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{daysSinceLastWorkout}</div>
            <div className="text-xs text-gray-400 mt-1">DAYS SINCE YOUR<br />LAST WORKOUT</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{freshMuscleCount}</div>
            <div className="text-xs text-gray-400 mt-1">FRESH MUSCLE<br />GROUPS</div>
          </div>
        </div>
      )}

      {/* Title */}
      {mode === 'select' && (
        <h2 className="text-2xl font-bold text-white text-center mb-6">{title}</h2>
      )}

      {mode === 'select' && selectedMuscles.length > 0 && (
        <div className="text-center mb-4">
          <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            MUSCLE FOCUS ({selectedMuscles.length})
          </div>
        </div>
      )}

      {/* Muscle Group Grid */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(muscleGroupConfigs).map(([muscleKey, config]) => {
          const muscle = muscleKey as MuscleGroup;
          const status = getMuscleRecoveryStatus(muscle);
          const color = getMuscleColor(muscle);
          const selected = isSelected(muscle);

          return (
            <button
              key={muscle}
              onClick={() => handleMuscleClick(muscle)}
              onMouseEnter={() => setHoveredMuscle(muscle)}
              onMouseLeave={() => setHoveredMuscle(null)}
              className={`
                relative p-4 rounded-xl transition-all duration-200
                ${selected 
                  ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg scale-105' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
                ${hoveredMuscle === muscle ? 'scale-105 shadow-xl' : ''}
                active:scale-95
              `}
              style={{
                borderLeft: mode === 'view' ? `4px solid ${color}` : undefined,
              }}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">{muscleIcons[muscle]}</div>

              {/* Name */}
              <div className="text-sm font-bold">{config.displayName}</div>

              {/* Status Badge (view mode only) */}
              {mode === 'view' && (
                <div className="absolute top-2 right-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                    title={getRecoveryLabel(status)}
                  ></div>
                </div>
              )}

              {/* Selection Checkmark (select mode only) */}
              {mode === 'select' && selected && (
                <div className="absolute top-2 right-2 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hovered Muscle Details */}
      {mode === 'view' && hoveredMuscle && (
        <div className="mt-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">
              {muscleGroupConfigs[hoveredMuscle].displayName}
            </h3>
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: getMuscleColor(hoveredMuscle) + '30',
                color: getMuscleColor(hoveredMuscle)
              }}
            >
              {getRecoveryLabel(getMuscleRecoveryStatus(hoveredMuscle))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
            <div>
              <div className="text-gray-500 text-xs">Recovery Time</div>
              <div className="font-medium">{muscleGroupConfigs[hoveredMuscle].recoveryHours}h</div>
            </div>
            {muscleData.find(m => m.muscleGroup === hoveredMuscle)?.lastTrained && (
              <div>
                <div className="text-gray-500 text-xs">Last Trained</div>
                <div className="font-medium">
                  {new Date(muscleData.find(m => m.muscleGroup === hoveredMuscle)!.lastTrained!).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend (view mode only) */}
      {mode === 'view' && (
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRecoveryColor('fresh') }}></div>
            <span className="text-gray-400">Ready to train</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRecoveryColor('recovering') }}></div>
            <span className="text-gray-400">Recovering</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRecoveryColor('trained') }}></div>
            <span className="text-gray-400">Recently trained</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRecoveryColor('stale') }}></div>
            <span className="text-gray-400">Needs attention</span>
          </div>
        </div>
      )}
    </div>
  );
};
