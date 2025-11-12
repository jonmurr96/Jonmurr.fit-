import { useState, useEffect } from 'react';
import { getPersonalizedDashboardData } from '../services/onboardingSyncService';
import { useAuth } from '../contexts/AuthContext';

export interface PersonalizedData {
  dailyCalories?: number;
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  waterGoal?: number;
  currentWeight?: number;
  targetWeight?: number;
  mainGoal?: string;
  bmr?: number;
  tdee?: number;
}

/**
 * Hook to fetch and display personalized data from onboarding
 * Use this in dashboard components to show user's personalized goals and targets
 */
export function useOnboardingData() {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalizedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const personalizedData = await getPersonalizedDashboardData(user.id);
        setData(personalizedData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching personalized data:', err);
        setError(err.message || 'Failed to load personalized data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { data, loading, error };
}
