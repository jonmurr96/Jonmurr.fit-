import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createMealService, MealService } from '../services/database/mealService';
import { createUserService, UserService } from '../services/database/userService';
import { createProgressService, ProgressService } from '../services/database/progressService';
import { createMealPlanService, MealPlanService } from '../services/database/mealPlanService';
import { createWorkoutService, WorkoutService } from '../services/database/workoutService';
import { createGamificationService, GamificationService } from '../services/database/gamificationService';
import { createHeatMapService, HeatMapService } from '../services/database/heatMapService';
import { createFoodCatalogService, FoodCatalogService } from '../services/database/foodCatalogService';

export interface UserServices {
  mealService: MealService;
  userService: UserService;
  progressService: ProgressService;
  mealPlanService: MealPlanService;
  workoutService: WorkoutService;
  gamificationService: GamificationService;
  heatMapService: HeatMapService;
  foodCatalogService: FoodCatalogService;
}

export const useUserServices = (): UserServices => {
  const { user } = useAuth();

  if (!user) {
    throw new Error('useUserServices must be used within an authenticated context. User is not logged in.');
  }

  const userId = user.id;

  const services = useMemo(
    () => ({
      mealService: createMealService(userId),
      userService: createUserService(userId),
      progressService: createProgressService(userId),
      mealPlanService: createMealPlanService(userId),
      workoutService: createWorkoutService(userId),
      gamificationService: createGamificationService(userId),
      heatMapService: createHeatMapService(userId),
      foodCatalogService: createFoodCatalogService(userId),
    }),
    [userId]
  );

  return services;
};
