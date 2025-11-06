import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'meals' | 'food_items' | 'weight_logs' | 'water_logs' | 'workout_history' | 'streaks' | 'milestones';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export const useRealtimeSubscription = ({
  table,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSubscriptionOptions) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, onInsert, onUpdate, onDelete]);
};
