import { supabase } from '../supabaseClient';
import { WeightLog, WaterLog, PhotoBundle, Milestone } from '../../types';

export interface ProgressService {
  getWeightLogs(): Promise<WeightLog[]>;
  addWeightLog(date: string, weightKg: number): Promise<void>;
  getWaterLog(date: string): Promise<WaterLog>;
  getAllWaterLogs(): Promise<WaterLog[]>;
  updateWaterLog(date: string, intakeOz: number): Promise<void>;
  getPhotoBundles(): Promise<PhotoBundle[]>;
  addProgressPhoto(date: string, angle: 'front' | 'side' | 'back', photoUrl: string): Promise<void>;
  getMilestones(): Promise<Milestone[]>;
  addMilestone(milestone: Milestone): Promise<void>;
}

export const createProgressService = (userId: string): ProgressService => {
  const getWeightLogs = async (): Promise<WeightLog[]> => {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weight logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      date: log.date,
      weightKg: log.weight_kg,
    }));
  };

  const addWeightLog = async (date: string, weightKg: number): Promise<void> => {
    const { error } = await supabase
      .from('weight_logs')
      .upsert({
        user_id: userId,
        date,
        weight_kg: weightKg,
      });

    if (error) {
      console.error('Error adding weight log:', error);
      throw error;
    }
  };

  const getWaterLog = async (date: string): Promise<WaterLog> => {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) {
      return { date, intake: 0 };
    }

    return {
      date: data.date,
      intake: data.intake_oz,
    };
  };

  const getAllWaterLogs = async (): Promise<WaterLog[]> => {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching water logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      date: log.date,
      intake: log.intake_oz,
    }));
  };

  const updateWaterLog = async (date: string, intakeOz: number): Promise<void> => {
    const { error } = await supabase
      .from('water_logs')
      .upsert({
        user_id: userId,
        date,
        intake_oz: intakeOz,
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Error updating water log:', error);
      throw error;
    }
  };

  const getPhotoBundles = async (): Promise<PhotoBundle[]> => {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
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
  };

  const addProgressPhoto = async (date: string, angle: 'front' | 'side' | 'back', photoUrl: string): Promise<void> => {
    const { error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: userId,
        date,
        angle,
        photo_url: photoUrl,
      });

    if (error) {
      console.error('Error adding progress photo:', error);
      throw error;
    }
  };

  const getMilestones = async (): Promise<Milestone[]> => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
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
  };

  const addMilestone = async (milestone: Milestone): Promise<void> => {
    const { error } = await supabase
      .from('milestones')
      .insert({
        user_id: userId,
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
  };

  return {
    getWeightLogs,
    addWeightLog,
    getWaterLog,
    getAllWaterLogs,
    updateWaterLog,
    getPhotoBundles,
    addProgressPhoto,
    getMilestones,
    addMilestone,
  };
};

export const progressService = createProgressService('default_user');
