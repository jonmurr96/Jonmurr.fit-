import { supabase } from '../supabaseClient';
import { WeightLog, WaterLog, PhotoBundle, Milestone } from '../../types';

const USER_ID = 'default_user';

export const progressService = {
  async getWeightLogs(): Promise<WeightLog[]> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weight logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      date: log.date,
      weightKg: log.weight_kg,
    }));
  },

  async addWeightLog(date: string, weightKg: number): Promise<void> {
    const { error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: USER_ID,
        date,
        weight_kg: weightKg,
      });

    if (error) {
      console.error('Error adding weight log:', error);
      throw error;
    }
  },

  async getWaterLog(date: string): Promise<WaterLog> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('date', date)
      .single();

    if (error || !data) {
      return { date, intake: 0 };
    }

    return {
      date: data.date,
      intake: data.intake_oz,
    };
  },

  async updateWaterLog(date: string, intakeOz: number): Promise<void> {
    const { error } = await supabase
      .from('water_logs')
      .upsert({
        user_id: USER_ID,
        date,
        intake_oz: intakeOz,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating water log:', error);
      throw error;
    }
  },

  async getPhotoBundles(): Promise<PhotoBundle[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching photo bundles:', error);
      return [];
    }

    const bundleMap = new Map<string, PhotoBundle>();

    for (const photo of data || []) {
      if (!bundleMap.has(photo.date)) {
        bundleMap.set(photo.date, {
          date: photo.date,
          photos: {},
        });
      }

      const bundle = bundleMap.get(photo.date)!;
      bundle.photos[photo.angle as 'front' | 'side' | 'back'] = {
        id: photo.id,
        url: photo.photo_url,
      };
    }

    return Array.from(bundleMap.values());
  },

  async addProgressPhoto(date: string, angle: 'front' | 'side' | 'back', photoUrl: string): Promise<void> {
    const { error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: USER_ID,
        date,
        angle,
        photo_url: photoUrl,
      });

    if (error) {
      console.error('Error adding progress photo:', error);
      throw error;
    }
  },

  async getMilestones(): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }

    return (data || []).map((milestone: any) => ({
      id: milestone.milestone_id,
      date: milestone.date,
      type: milestone.type,
      title: milestone.title,
      description: milestone.description,
    }));
  },

  async addMilestone(milestone: Milestone): Promise<void> {
    const { error } = await supabase
      .from('milestones')
      .insert({
        user_id: USER_ID,
        milestone_id: milestone.id,
        date: milestone.date,
        type: milestone.type,
        title: milestone.title,
        description: milestone.description,
      });

    if (error) {
      console.error('Error adding milestone:', error);
      throw error;
    }
  },
};
