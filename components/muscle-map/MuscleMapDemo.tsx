import { useState, useEffect } from 'react';
import { MuscleGroupSelector, MuscleData } from './MuscleGroupSelector';
import { MuscleGroup } from '../../types';
import { createMuscleTrackingService } from '../../services/muscleTrackingService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Demo component showing muscle map usage
 * This can be integrated into Dashboard or Workout screens
 */
export const MuscleMapDemo = () => {
  const { user } = useAuth();
  const [muscleData, setMuscleData] = useState<MuscleData[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [mode, setMode] = useState<'view' | 'select'>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMuscleData();
    }
  }, [user]);

  const loadMuscleData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const muscleService = createMuscleTrackingService(user.id);
      const recoveryData = await muscleService.getMuscleRecoveryStatus(30);

      // Convert recovery data to MuscleData format
      const data: MuscleData[] = recoveryData.map(recovery => ({
        muscleGroup: recovery.muscle_group,
        lastTrained: recovery.last_trained_date ? new Date(recovery.last_trained_date) : null,
        intensity: recovery.avg_intensity,
      }));

      setMuscleData(data);
    } catch (error) {
      console.error('Error loading muscle data:', error);
      // Show demo data if database not set up yet
      setMuscleData(getDemoMuscleData());
    } finally {
      setLoading(false);
    }
  };

  const handleMuscleToggle = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev => {
      if (prev.includes(muscle)) {
        return prev.filter(m => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    console.log('Muscle clicked:', muscle);
    // Here you could show a modal with detailed muscle info
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading muscle recovery data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setMode('view')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'view'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Recovery View
        </button>
        <button
          onClick={() => setMode('select')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            mode === 'select'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Target Selection
        </button>
      </div>

      {/* Muscle Group Selector */}
      <MuscleGroupSelector
        muscleData={muscleData}
        selectedMuscles={selectedMuscles}
        onMuscleToggle={handleMuscleToggle}
        onMuscleClick={handleMuscleClick}
        mode={mode}
        showStats={mode === 'view'}
      />

      {/* Selected Muscles Summary (select mode only) */}
      {mode === 'select' && selectedMuscles.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-3">
            Selected Target Areas ({selectedMuscles.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedMuscles.map(muscle => (
              <div
                key={muscle}
                className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium"
              >
                {muscle}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              // Here you would generate a workout based on selected muscles
              console.log('Generate workout for:', selectedMuscles);
              alert(`Generating workout for: ${selectedMuscles.join(', ')}`);
            }}
            className="mt-4 w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            Generate Workout
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="font-bold text-blue-400 mb-2">💡 Integration Guide</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Recovery View:</strong> Shows muscle recovery status with color coding</li>
          <li>• <strong>Target Selection:</strong> Let users pick muscles to focus on in workout generation</li>
          <li>• <strong>Database:</strong> Run migration_muscle_tracking.sql in Supabase first</li>
          <li>• <strong>Auto-tracking:</strong> Use trackMusclesFromExercises() to auto-log muscle engagement</li>
        </ul>
      </div>
    </div>
  );
};

// Demo data for when database isn't set up yet
const getDemoMuscleData = (): MuscleData[] => {
  const today = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };

  return [
    { muscleGroup: 'chest', lastTrained: daysAgo(1), intensity: 8 },
    { muscleGroup: 'triceps', lastTrained: daysAgo(1), intensity: 7 },
    { muscleGroup: 'shoulders', lastTrained: daysAgo(3), intensity: 6 },
    { muscleGroup: 'lats', lastTrained: daysAgo(2), intensity: 8 },
    { muscleGroup: 'biceps', lastTrained: daysAgo(2), intensity: 7 },
    { muscleGroup: 'quads', lastTrained: daysAgo(4), intensity: 9 },
    { muscleGroup: 'hamstrings', lastTrained: daysAgo(4), intensity: 8 },
    { muscleGroup: 'glutes', lastTrained: daysAgo(4), intensity: 7 },
    { muscleGroup: 'calves', lastTrained: daysAgo(6), intensity: 6 },
    { muscleGroup: 'abs', lastTrained: daysAgo(1), intensity: 5 },
    { muscleGroup: 'obliques', lastTrained: daysAgo(1), intensity: 5 },
    { muscleGroup: 'traps', lastTrained: daysAgo(3), intensity: 6 },
    { muscleGroup: 'lower_back', lastTrained: null, intensity: 0 }, // Never trained
  ];
};
