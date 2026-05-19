import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(
  tableName: string, 
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*', 
  callback: (payload: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-channel-${tableName}-${event}`)
      .on(
        'postgres_changes',
        { 
          event: event === '*' ? '*' : event, 
          schema: 'public', 
          table: tableName 
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, event, callback]);
}
