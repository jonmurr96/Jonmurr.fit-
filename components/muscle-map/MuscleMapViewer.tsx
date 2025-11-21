import { useState } from 'react';
import { MuscleGroup } from '../../types';
import { muscleGroupConfigs, RecoveryStatus, getRecoveryColor, getRecoveryLabel } from '../../utils/muscleMapping';

export interface MuscleData {
  muscleGroup: MuscleGroup;
  lastTrained: Date | null;
  intensity?: number;
}

interface MuscleMapViewerProps {
  muscleData: MuscleData[];
  onMuscleClick?: (muscle: MuscleGroup) => void;
  viewMode?: 'front' | 'back';
  showStats?: boolean;
}

export const MuscleMapViewer = ({
  muscleData,
  onMuscleClick,
  viewMode: initialViewMode = 'front',
  showStats = true,
}: MuscleMapViewerProps) => {
  const [viewMode, setViewMode] = useState<'front' | 'back'>(initialViewMode);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

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
    setSelectedMuscle(muscle);
    onMuscleClick?.(muscle);
  };

  const daysSinceLastWorkout = muscleData.length > 0
    ? Math.floor(
        Math.min(...muscleData.map(m => 
          m.lastTrained ? (Date.now() - m.lastTrained.getTime()) / (1000 * 60 * 60 * 24) : 999
        ))
      )
    : 0;

  const freshMuscleCount = muscleData.filter(m => getMuscleRecoveryStatus(m.muscleGroup) === 'fresh').length;

  const visibleMuscles = Object.entries(muscleGroupConfigs).filter(([_, config]) => {
    if (viewMode === 'front') {
      return config.svgFilenameFront;
    } else {
      return config.svgFilenameBack;
    }
  });

  return (
    <div className="w-full">
      {/* Stats Header */}
      {showStats && (
        <div className="mb-6 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{daysSinceLastWorkout}</div>
            <div className="text-sm text-gray-400">DAYS SINCE YOUR<br />LAST WORKOUT</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{freshMuscleCount}</div>
            <div className="text-sm text-gray-400">FRESH MUSCLE<br />GROUPS</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-4 flex justify-center gap-2">
        <button
          onClick={() => setViewMode('front')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'front'
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Front View
        </button>
        <button
          onClick={() => setViewMode('back')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'back'
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Back View
        </button>
      </div>

      {/* Muscle Map */}
      <div className="relative mx-auto max-w-md">
        {/* Body Outline */}
        <div className="relative">
          <img
            src={`/assets/anatomy/${viewMode === 'front' ? 'front/Body outline with white background.svg' : 'back/Body outline with no background.svg'}`}
            alt="Body outline"
            className="w-full h-auto"
            onError={(e) => {
              console.error('Failed to load body outline');
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Muscle Overlays */}
          <div className="absolute inset-0">
            {visibleMuscles.map(([muscleKey, config]) => {
              const muscle = muscleKey as MuscleGroup;
              const svgFilename = viewMode === 'front' ? config.svgFilenameFront : config.svgFilenameBack;
              if (!svgFilename) return null;

              const color = getMuscleColor(muscle);
              const isSelected = selectedMuscle === muscle;

              return (
                <div
                  key={muscle}
                  className="absolute inset-0 cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleMuscleClick(muscle)}
                  style={{
                    filter: isSelected ? 'brightness(1.3)' : 'brightness(1)',
                  }}
                >
                  <img
                    src={`/assets/anatomy/${viewMode}/${svgFilename}`}
                    alt={config.displayName}
                    className="w-full h-auto"
                    style={{
                      filter: `hue-rotate(${color === '#10b981' ? '0deg' : color === '#f59e0b' ? '30deg' : color === '#ef4444' ? '0deg' : '0deg'})`,
                      opacity: 0.7,
                    }}
                    onError={(e) => {
                      console.error(`Failed to load ${svgFilename}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getRecoveryColor('fresh') }}></div>
            <span className="text-gray-300">Ready to train</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getRecoveryColor('recovering') }}></div>
            <span className="text-gray-300">Recovering</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getRecoveryColor('trained') }}></div>
            <span className="text-gray-300">Recently trained</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getRecoveryColor('stale') }}></div>
            <span className="text-gray-300">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Selected Muscle Details */}
      {selectedMuscle && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2">
            {muscleGroupConfigs[selectedMuscle].displayName}
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium" style={{ color: getMuscleColor(selectedMuscle) }}>
                {getRecoveryLabel(getMuscleRecoveryStatus(selectedMuscle))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Recovery Time:</span>
              <span className="font-medium">{muscleGroupConfigs[selectedMuscle].recoveryHours}h</span>
            </div>
            {muscleData.find(m => m.muscleGroup === selectedMuscle)?.lastTrained && (
              <div className="flex justify-between">
                <span>Last Trained:</span>
                <span className="font-medium">
                  {new Date(muscleData.find(m => m.muscleGroup === selectedMuscle)!.lastTrained!).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
