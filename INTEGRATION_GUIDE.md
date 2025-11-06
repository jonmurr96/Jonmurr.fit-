# Supabase Integration Guide

This document explains how to integrate Supabase into your existing Jonmurr.fit application.

## Overview

The application has been set up with a complete Supabase backend, but to keep your existing app working, the integration needs to be completed manually. This allows you to:

1. Test the Supabase setup independently
2. Migrate data gradually
3. Maintain backward compatibility during transition

## What Has Been Created

### Database Layer
- ✅ **Schema**: Complete database schema with 17 tables (`supabase/migrations/`)
- ✅ **RLS Policies**: Row-level security for all tables
- ✅ **Triggers**: Automatic user setup, streak tracking, timestamp updates
- ✅ **Indexes**: Performance optimization

### Application Layer
- ✅ **Database Service** (`services/databaseService.ts`): Complete CRUD operations
- ✅ **Supabase Client** (`services/supabaseClient.ts`): Configured client
- ✅ **Auth Provider** (`components/AuthProvider.tsx`): Authentication context
- ✅ **Auth Screen** (`components/AuthScreen.tsx`): Login/signup UI
- ✅ **Realtime Hook** (`hooks/useRealtimeSubscription.ts`): Live updates
- ✅ **TypeScript Types** (`types/supabase.ts`): Full type safety

## Integration Steps

### Step 1: Set Up Supabase Project

Follow the instructions in `SUPABASE_SETUP.md` to:
1. Create your Supabase project
2. Run the migrations
3. Configure environment variables

### Step 2: Wrap Your App with AuthProvider

Update `index.tsx`:

```tsx
import { AuthProvider } from './components/AuthProvider';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### Step 3: Add Authentication Gate to App.tsx

At the top of `App.tsx`, add:

```tsx
import { useAuth } from './components/AuthProvider';
import { AuthScreen } from './components/AuthScreen';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // ... rest of your app
}
```

### Step 4: Replace localStorage with Database Service

Replace the `useStickyState` hook with database calls. Example for meals:

#### Before (localStorage):
```tsx
const [meals, setMeals] = useStickyState<Meal[]>([], 'jonmurrfit-meals');
```

#### After (Supabase):
```tsx
const [meals, setMeals] = useState<Meal[]>([]);

// Load meals on mount
useEffect(() => {
  const loadMeals = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const data = await getMealsForDate(todayStr);
    setMeals(data);
  };
  loadMeals();
}, []);

// Update addMeal callback
const addMeal = useCallback(async (type: Meal['type'], items: FoodItem[]) => {
  if (items.length === 0) return;
  const todayStr = new Date().toISOString().split('T')[0];
  await addMeal(type, items, todayStr);

  // Refresh meals
  const data = await getMealsForDate(todayStr);
  setMeals(data);
}, []);
```

### Step 5: Add Real-time Subscriptions

For live updates across devices:

```tsx
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';

// In your component:
useRealtimeSubscription({
  table: 'meals',
  onInsert: () => {
    // Refresh meals when new one is added
    refreshMeals();
  },
  onDelete: () => {
    refreshMeals();
  }
});
```

### Step 6: Migrate Each Feature

Replace localStorage for each feature systematically:

#### Macro Targets
```tsx
import { getMacroTargets, updateMacroTargets } from './services/databaseService';

// Load
const targets = await getMacroTargets();

// Save
await updateMacroTargets(newTargets);
```

#### Weight Logs
```tsx
import { getWeightLogs, addWeightLog } from './services/databaseService';

const logs = await getWeightLogs();
await addWeightLog({ date: '2025-01-06', weightKg: 85.5 });
```

#### Training Programs
```tsx
import { getActiveTrainingProgram, saveTrainingProgram } from './services/databaseService';

const program = await getActiveTrainingProgram();
await saveTrainingProgram(newProgram);
```

## Feature Mapping

| Feature | localStorage Key | Database Service Function |
|---------|-----------------|---------------------------|
| Meals | `jonmurrfit-meals` | `getMealsForDate()`, `addMeal()` |
| Macro Targets | `jonmurrfit-macroTargets` | `getMacroTargets()`, `updateMacroTargets()` |
| Training Program | `jonmurrfit-program` | `getActiveTrainingProgram()`, `saveTrainingProgram()` |
| Weight Logs | `jonmurrfit-weightLogs` | `getWeightLogs()`, `addWeightLog()` |
| Water Logs | `jonmurrfit-waterLogs` | `getWaterLogs()`, `updateWaterLog()` |
| Saved Workouts | `jonmurrfit-savedWorkouts` | `getSavedWorkouts()`, `addSavedWorkout()` |
| Workout History | `jonmurrfit-workoutHistory` | `getWorkoutHistory()`, `addWorkoutHistory()` |
| Quick Add Meals | `jonmurrfit-quickAddMeals` | `getQuickAddMeals()`, `addQuickAddMeal()` |
| Favorite Exercises | `jonmurrfit-favorites` | `getFavoriteExercises()`, `addFavoriteExercise()` |
| Drafts | `jonmurrfit-drafts` | `getWorkoutDrafts()`, `saveWorkoutDraft()` |
| Photos | `jonmurrfit-photos` | `getPhotoBundles()`, `addPhotoBundle()` |
| Milestones | `jonmurrfit-milestones` | `getMilestones()`, `addMilestone()` |
| Settings | Various keys | `getUserSettings()`, `updateUserSettings()` |

## Benefits After Migration

1. **Multi-device Sync**: Data syncs across all devices
2. **Real-time Updates**: See changes instantly
3. **Data Persistence**: Never lose data (cloud backup)
4. **Streaks**: Automatic tracking of workout, nutrition, and water streaks
5. **Security**: Row-level security ensures data privacy
6. **Scalability**: PostgreSQL backend can handle millions of records

## Backward Compatibility

During migration, you can:
- Keep existing localStorage alongside Supabase
- Migrate features one at a time
- Test each feature independently
- Fall back to localStorage if needed

## Testing Your Integration

1. **Sign Up**: Create a new account
2. **Log a Meal**: Add some food items
3. **Check Database**: Verify data in Supabase dashboard
4. **Log Out/In**: Ensure data persists
5. **Multiple Devices**: Test sync across browsers/devices

## Troubleshooting

### Data Not Saving
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Ensure user is authenticated (`user` is not null)
- Check RLS policies are applied correctly

### Real-time Not Working
- Ensure realtime is enabled for the table in Supabase
- Check subscription channel name matches table name
- Verify you're calling `useRealtimeSubscription` correctly

### Authentication Issues
- Check email confirmation (if enabled)
- Verify auth provider is enabled in Supabase
- Check for CORS errors in console

## Next Steps

1. Complete Supabase project setup
2. Update `index.tsx` with AuthProvider
3. Add authentication gate to App.tsx
4. Migrate one feature at a time
5. Test thoroughly
6. Remove localStorage once confident

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Realtime Guide**: https://supabase.com/docs/guides/realtime
