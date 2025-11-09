import { supabase } from '../supabaseClient';

export type DatabaseHealth = {
  isHealthy: boolean;
  missingTables: boolean;
  error?: string;
};

export const checkDatabaseHealth = async (): Promise<DatabaseHealth> => {
  try {
    const { error } = await supabase
      .from('user_profile')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          isHealthy: false,
          missingTables: true,
          error: 'Database tables have not been created yet'
        };
      }
      
      return {
        isHealthy: false,
        missingTables: false,
        error: error.message
      };
    }

    return {
      isHealthy: true,
      missingTables: false
    };
  } catch (error) {
    return {
      isHealthy: false,
      missingTables: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
