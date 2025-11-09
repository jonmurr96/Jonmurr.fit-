import { supabase } from '../supabaseClient';
import { UserProfile, MacroTargets } from '../../types';

const USER_ID = 'default_user';

export const userService = {
  async getProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) return null;

    return {
      name: data.name,
      avatarUrl: data.avatar_url,
      heightCm: data.height_cm,
    };
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    const { error } = await supabase
      .from('user_profile')
      .upsert({
        user_id: USER_ID,
        name: profile.name,
        avatar_url: profile.avatarUrl,
        height_cm: profile.heightCm,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async getMacroTargets(): Promise<MacroTargets | null> {
    const { data, error } = await supabase
      .from('macro_targets')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (error) {
      console.error('Error fetching macro targets:', error);
      return null;
    }

    if (!data) return null;

    return {
      rest: {
        calories: data.rest_calories,
        protein: data.rest_protein,
        carbs: data.rest_carbs,
        fat: data.rest_fat,
      },
      training: {
        calories: data.training_calories,
        protein: data.training_protein,
        carbs: data.training_carbs,
        fat: data.training_fat,
      },
    };
  },

  async updateMacroTargets(targets: MacroTargets): Promise<void> {
    const { error } = await supabase
      .from('macro_targets')
      .upsert({
        user_id: USER_ID,
        rest_calories: targets.rest.calories,
        rest_protein: targets.rest.protein,
        rest_carbs: targets.rest.carbs,
        rest_fat: targets.rest.fat,
        training_calories: targets.training.calories,
        training_protein: targets.training.protein,
        training_carbs: targets.training.carbs,
        training_fat: targets.training.fat,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating macro targets:', error);
      throw error;
    }
  },
};
