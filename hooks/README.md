# useUserServices Hook

## Overview
The `useUserServices` hook provides authenticated, user-scoped database service instances throughout the application. It ensures all database operations are performed with the correct user context for multi-user data isolation.

## Usage

### Basic Example
```typescript
import { useUserServices } from '../hooks/useUserServices';

function MyComponent() {
  const { mealService, workoutService, gamificationService } = useUserServices();

  useEffect(() => {
    const loadData = async () => {
      // All services automatically use the authenticated user's ID
      const meals = await mealService.getDailyLog('2025-11-11');
      const activeProgram = await workoutService.getActiveProgram();
      const xp = await gamificationService.getXP();
      
      console.log('User meals:', meals);
      console.log('Active program:', activeProgram);
      console.log('User XP:', xp);
    };
    
    loadData();
  }, [mealService, workoutService, gamificationService]);

  return <div>...</div>;
}
```

### Available Services
The hook returns an object with all 6 database services:

- **mealService**: Meal logging, daily logs, quick-add meals
- **userService**: User profiles and macro targets
- **progressService**: Weight logs, water logs, progress photos, milestones
- **mealPlanService**: AI-generated meal plan management
- **workoutService**: Training programs, workouts, exercises, sets, history
- **gamificationService**: XP, streaks, badges, challenges, loot, AI usage

### Important Notes

1. **Authentication Required**: This hook can only be used within authenticated contexts. It will throw an error if the user is not logged in.

2. **Memoization**: Service instances are memoized based on `userId`, ensuring stable references and preventing unnecessary re-instantiation.

3. **Multi-User Support**: Each service instance is scoped to the authenticated user's ID, ensuring complete data isolation between users.

### Migration from Default Services

**Before (using default singleton):**
```typescript
import { mealService } from '../services/database/mealService';

// This uses 'default_user' - NOT user-scoped!
const meals = await mealService.getDailyLog('2025-11-11');
```

**After (using authenticated services):**
```typescript
import { useUserServices } from '../hooks/useUserServices';

function MyComponent() {
  const { mealService } = useUserServices();
  
  // This uses the authenticated user's ID - properly scoped!
  const meals = await mealService.getDailyLog('2025-11-11');
}
```

## Architecture

### Factory Pattern
Each service uses a factory pattern:
- `createMealService(userId)` → MealService
- `createUserService(userId)` → UserService
- `createProgressService(userId)` → ProgressService
- `createMealPlanService(userId)` → MealPlanService
- `createWorkoutService(userId)` → WorkoutService
- `createGamificationService(userId)` → GamificationService

### Closure-Based Design
All service methods capture `userId` from the factory scope using closures, eliminating `this` bindings and ensuring consistent user context throughout all operations.

## Error Handling

If used outside an authenticated context:
```typescript
// ❌ This will throw an error
function UnauthenticatedComponent() {
  const services = useUserServices(); // Error: User is not logged in
}
```

Always ensure the hook is used within components that are only rendered when authenticated (e.g., after sign-in, within AuthRouter's authenticated routes).
