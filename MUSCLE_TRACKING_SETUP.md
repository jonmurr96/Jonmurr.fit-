# Muscle Tracking System - Setup & Usage Guide

## Overview

The Muscle Tracking System brings your workout recovery visualization to life with:
- **Interactive Muscle Heatmap**: Visual recovery status for all 13 muscle groups
- **Smart Recovery Tracking**: Color-coded status (fresh, recovering, recently trained, needs attention)
- **Auto-detection**: Automatically tracks which muscles were worked based on exercises
- **Target Selection**: Let users pick muscle groups when generating AI workouts
- **Database Integration**: Full Supabase backend with RLS policies

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Apply Database Migration

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Open `supabase/migration_muscle_tracking.sql` from this project
5. Copy and paste the entire contents
6. Click **Run** (or Ctrl/Cmd + Enter)
7. ✅ Should see "Success"

This creates:
- `workout_muscle_engagement` table
- Helper functions for tracking and querying
- RLS policies for multi-user support

### Step 2: Add Muscle Anatomy Assets

The muscle SVG assets are already organized in:
```
public/assets/anatomy/
├── front/
│   ├── Pectoralis Major.svg
│   ├── Deltoids.svg
│   ├── Biceps brachii.svg
│   └── ... (29 SVG files)
└── back/
    ├── Lattisimus dorsi.svg
    ├── Gluteus maximus.svg
    └── ... (29 SVG files)
```

### Step 3: Try the Demo Component

Add to any screen to test:
```tsx
import { MuscleMapDemo } from './components/muscle-map/MuscleMapDemo';

// In your component
<MuscleMapDemo />
```

---

## 📊 Components

### 1. MuscleGroupSelector
Grid-based muscle group selector with recovery status visualization.

**View Mode** - Shows recovery status:
```tsx
import { MuscleGroupSelector } from './components/muscle-map/MuscleGroupSelector';
import { createMuscleTrackingService } from './services/muscleTrackingService';

const muscleService = createMuscleTrackingService(user.id);
const recoveryData = await muscleService.getMuscleRecoveryStatus(30);

<MuscleGroupSelector
  muscleData={recoveryData}
  mode="view"
  onMuscleClick={(muscle) => console.log('Show details for:', muscle)}
  showStats={true}
/>
```

**Select Mode** - Target muscle selection:
```tsx
<MuscleGroupSelector
  muscleData={muscleData}
  selectedMuscles={selectedMuscles}
  onMuscleToggle={(muscle) => {
    // Toggle muscle selection
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  }}
  mode="select"
  title="PICK YOUR TARGET AREAS"
/>
```

### 2. MuscleMapViewer
SVG-based anatomical view with front/back toggle (work in progress).

```tsx
import { MuscleMapViewer } from './components/muscle-map/MuscleMapViewer';

<MuscleMapViewer
  muscleData={muscleData}
  viewMode="front"
  onMuscleClick={(muscle) => showMuscleDetails(muscle)}
/>
```

---

## 🔧 Service Methods

### Track Muscle Engagement

**Auto-detect from exercises:**
```tsx
const muscleService = createMuscleTrackingService(user.id);

await muscleService.trackMusclesFromExercises(
  workoutId,
  "Upper Body Day",
  "2025-01-21",
  [
    { name: "Bench Press", sets: 4 },
    { name: "Lat Pulldown", sets: 3 },
    { name: "Shoulder Press", sets: 3 },
  ]
);
// Auto-detects: chest, triceps, shoulders, lats, biceps
```

**Manual tracking:**
```tsx
await muscleService.trackMuscleEngagement(
  workoutId,
  "Leg Day",
  "2025-01-21",
  ['quads', 'hamstrings', 'glutes'],
  [8, 7, 9] // Intensity ratings (1-10)
);
```

### Get Recovery Status

```tsx
// Get all muscle groups with recovery info
const status = await muscleService.getMuscleRecoveryStatus(30);
// Returns: [{ muscle_group, last_trained_date, days_since_trained, total_workouts, avg_intensity }]

// Get only fresh muscles (ready to train)
const fresh = await muscleService.getFreshMuscles(48);
// Returns: [{ muscle_group, last_trained_date, hours_since_trained }]
```

### Query Muscle History

```tsx
// Get history for specific muscle
const chestHistory = await muscleService.getMuscleHistory('chest', 30);

// Get muscles worked in a specific workout
const workoutMuscles = await muscleService.getWorkoutMuscles(workoutId);

// Get summary for date range
const summary = await muscleService.getMuscleEngagementSummary(
  '2025-01-01',
  '2025-01-31'
);
// Returns: { chest: { count: 8, avgIntensity: 7.5 }, ... }
```

---

## 🎨 Recovery Status Colors

The system uses a 4-tier color coding:

| Status | Color | Meaning | Hours Since Last Workout |
|--------|-------|---------|--------------------------|
| **Fresh** | 🟢 Green | Ready to train | ≥ recovery time (48-72h) |
| **Recovering** | 🟡 Yellow | Still recovering | ≥ 50% of recovery time |
| **Trained** | 🔴 Red | Recently trained | < 50% of recovery time |
| **Stale** | ⚪ Gray | Needs attention | 7+ days untrained |

Recovery times by muscle group:
- **Large muscles** (quads, hamstrings, glutes, lower_back): 72 hours
- **Medium muscles** (chest, lats, shoulders, biceps, triceps, traps, calves): 48 hours
- **Core** (abs, obliques): 36 hours

---

## 📱 Integration Examples

### Dashboard - Recovery Heatmap

```tsx
// screens/HomeScreen.tsx
import { MuscleGroupSelector } from '../components/muscle-map/MuscleGroupSelector';

const HomeScreen = () => {
  const [muscleData, setMuscleData] = useState([]);
  
  useEffect(() => {
    const loadMuscles = async () => {
      const service = createMuscleTrackingService(user.id);
      const data = await service.getMuscleRecoveryStatus();
      setMuscleData(data);
    };
    loadMuscles();
  }, []);
  
  return (
    <>
      {/* Other dashboard content */}
      
      <div className="bg-gray-900 rounded-2xl p-6 mt-4">
        <h2 className="text-xl font-bold text-white mb-4">Muscle Recovery</h2>
        <MuscleGroupSelector
          muscleData={muscleData}
          mode="view"
          showStats={true}
        />
      </div>
    </>
  );
};
```

### Workout Generation - Target Selection

```tsx
// components/WorkoutGenerator.tsx
import { MuscleGroupSelector } from './muscle-map/MuscleGroupSelector';

const WorkoutGenerator = () => {
  const [targetMuscles, setTargetMuscles] = useState<MuscleGroup[]>([]);
  
  const handleGenerateWorkout = async () => {
    // Pass targetMuscles to AI workout generation
    const workout = await generateAIWorkout({
      focusMuscles: targetMuscles,
      // ... other params
    });
  };
  
  return (
    <>
      <MuscleGroupSelector
        muscleData={muscleData}
        selectedMuscles={targetMuscles}
        onMuscleToggle={(muscle) => {
          setTargetMuscles(prev =>
            prev.includes(muscle)
              ? prev.filter(m => m !== muscle)
              : [...prev, muscle]
          );
        }}
        mode="select"
        title="SELECT TARGET AREAS"
      />
      
      <button 
        onClick={handleGenerateWorkout}
        disabled={targetMuscles.length === 0}
      >
        Generate Workout
      </button>
    </>
  );
};
```

### Auto-Track After Workout

```tsx
// When user completes a workout
const handleWorkoutComplete = async (workout: Workout) => {
  const muscleService = createMuscleTrackingService(user.id);
  
  // Auto-track muscles from exercises
  await muscleService.trackMusclesFromExercises(
    workout.id,
    workout.name,
    new Date().toISOString().split('T')[0],
    workout.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.length
    }))
  );
  
  // Show success message
  toast.success('Workout logged! Muscle recovery updated.');
};
```

---

## 🗂 File Structure

```
components/
  muscle-map/
    MuscleGroupSelector.tsx      # Grid-based selector (primary)
    MuscleMapViewer.tsx          # SVG anatomical view (WIP)
    MuscleMapDemo.tsx            # Demo/test component

services/
  muscleTrackingService.ts       # Database service layer

utils/
  muscleMapping.ts               # Muscle group configs, exercise mapping

supabase/
  migration_muscle_tracking.sql  # Database schema

public/
  assets/
    anatomy/
      front/                     # 29 front view muscle SVGs
      back/                      # 29 back view muscle SVGs
```

---

## 🔬 Testing

1. **Apply Migration**: Run `migration_muscle_tracking.sql` in Supabase
2. **View Demo**: Add `<MuscleMapDemo />` to any screen
3. **Toggle Modes**: Switch between view and select modes
4. **Test Tracking**: Complete a workout and verify muscle engagement is saved
5. **Check Recovery**: Wait 24h and verify muscle colors change to yellow/green

---

## 🚀 Next Steps

### Immediate Integration
1. Add muscle selector to workout generation flow
2. Display recovery heatmap on Dashboard
3. Auto-track muscles when workouts are completed

### Future Enhancements
1. Complete SVG-based anatomical view (MuscleMapViewer)
2. Add muscle group filtering to exercise library
3. Progressive overload recommendations based on muscle recovery
4. Weekly muscle engagement charts
5. "Neglected muscles" warnings

---

## ❓ Troubleshooting

**Q: "Cannot read properties of undefined (reading 'map')"**
A: Make sure you've applied the database migration first. The component will show demo data if the database isn't set up.

**Q: Recovery data not showing?**
A: You need at least one completed workout with tracked muscles. Use `trackMusclesFromExercises()` when workouts are completed.

**Q: RLS policies failing?**
A: Ensure your `user_id` matches `auth.uid()::text` format. Check Supabase logs for specific policy violations.

**Q: SVG images not loading?**
A: Verify files exist in `public/assets/anatomy/front/` and `/back/`. Check browser console for 404 errors.

---

## 📚 Resources

- Muscle Group Mapping: `utils/muscleMapping.ts`
- Recovery Formulas: `getRecoveryStatus()` function
- Database Schema: `supabase/migration_muscle_tracking.sql`
- Demo Component: `components/muscle-map/MuscleMapDemo.tsx`

---

**Built with ❤️ for jonmurr.fit**
