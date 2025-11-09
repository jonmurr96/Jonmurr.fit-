import { supabase } from '../supabaseClient';
import { GeneratedMealPlan } from '../../types';

const USER_ID = 'default_user';

export const mealPlanService = {
  async getActiveMealPlan(): Promise<(GeneratedMealPlan & { id: string }) | null> {
    const { data, error } = await supabase
      .from('generated_meal_plans')
      .select('*')
      .eq('user_id', USER_ID)
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
  },

  async saveMealPlan(mealPlan: GeneratedMealPlan, isActive: boolean = false): Promise<void> {
    if (isActive) {
      await supabase
        .from('generated_meal_plans')
        .update({ is_active: false })
        .eq('user_id', USER_ID)
        .eq('is_active', true);
    }

    const { error } = await supabase
      .from('generated_meal_plans')
      .insert({
        user_id: USER_ID,
        plan_name: mealPlan.planName,
        description: mealPlan.description,
        daily_plan: mealPlan.dailyPlan,
        is_active: isActive,
      });

    if (error) {
      console.error('Error saving meal plan:', error);
      throw error;
    }
  },

  async getAllMealPlans(): Promise<(GeneratedMealPlan & { id: string })[]> {
    const { data, error } = await supabase
      .from('generated_meal_plans')
      .select('*')
      .eq('user_id', USER_ID)
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
  },

  async deleteMealPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('generated_meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    }
  },
};
