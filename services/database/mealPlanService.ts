import { supabase } from '../supabaseClient';
import { GeneratedMealPlan } from '../../types';

export interface MealPlanService {
  getActiveMealPlan(): Promise<(GeneratedMealPlan & { id: string }) | null>;
  saveMealPlan(mealPlan: GeneratedMealPlan, isActive?: boolean): Promise<void>;
  getAllMealPlans(): Promise<(GeneratedMealPlan & { id: string })[]>;
  deleteMealPlan(planId: string): Promise<void>;
}

export const createMealPlanService = (userId: string): MealPlanService => {
  const getActiveMealPlan = async (): Promise<(GeneratedMealPlan & { id: string }) | null> => {
    const { data, error } = await supabase
      .from('generated_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching active meal plan:', error);
      return null;
    }

    return {
      id: data.id,
      planName: data.plan_name,
      description: data.description,
      dailyPlan: data.daily_plan,
    };
  };

  const saveMealPlan = async (mealPlan: GeneratedMealPlan, isActive: boolean = false): Promise<void> => {
    if (isActive) {
      await supabase
        .from('generated_meal_plans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
    }

    const { error } = await supabase
      .from('generated_meal_plans')
      .insert({
        user_id: userId,
        plan_name: mealPlan.planName,
        description: mealPlan.description,
        daily_plan: mealPlan.dailyPlan,
        is_active: isActive,
      });

    if (error) {
      console.error('Error saving meal plan:', error);
      throw error;
    }
  };

  const getAllMealPlans = async (): Promise<(GeneratedMealPlan & { id: string })[]> => {
    const { data, error } = await supabase
      .from('generated_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meal plans:', error);
      return [];
    }

    return (data || []).map((plan: any) => ({
      id: plan.id,
      planName: plan.plan_name,
      description: plan.description,
      dailyPlan: plan.daily_plan,
    }));
  };

  const deleteMealPlan = async (planId: string): Promise<void> => {
    const { error } = await supabase
      .from('generated_meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    }
  };

  return {
    getActiveMealPlan,
    saveMealPlan,
    getAllMealPlans,
    deleteMealPlan,
  };
};

export const mealPlanService = createMealPlanService('default_user');
