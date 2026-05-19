import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export interface OutreachEntry {
  id: string;
  lead_id: string;
  channel: 'email' | 'phone' | 'social';
  message: string;
  sent_at: string;
  response?: string;
  outcome: 'no_reply' | 'interested' | 'rejected' | 'booked';
  leads?: {
    company_name: string;
  };
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  total_leads: number;
  new_leads: number;
  checked: number;
  contacted: number;
  proposals_sent: number;
  closed_won: number;
  revenue_pipeline: number;
}

export function useAnalytics() {
  const [outreachLogs, setOutreachLogs] = useState<OutreachEntry[]>([]);
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch outreach logs with lead details
      const { data: logData, error: logError } = await supabase
        .from('outreach_log')
        .select(`
          id,
          lead_id,
          channel,
          message,
          sent_at,
          outcome,
          leads ( company_name )
        `)
        .order('sent_at', { ascending: false })
        .limit(30);

      if (logError && logError.code !== 'PGRST116') {
        // Only throw if it's a real error (not just empty / schema not loaded yet)
        console.error("Outreach logs fetch failed:", logError);
      } else {
        // Format join data slightly for TypeScript ease
        const formattedLogs = (logData || []).map((item: any) => ({
          ...item,
          leads: Array.isArray(item.leads) ? item.leads[0] : item.leads
        }));
        setOutreachLogs(formattedLogs);
      }

      // 2. Fetch analytics snapshots for chart history
      const { data: snapshotData, error: snapError } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .order('date', { ascending: true })
        .limit(30);

      if (snapError) {
        console.error("Snapshots fetch failed:", snapError);
      } else {
        setSnapshots(snapshotData || []);
      }

    } catch (err: any) {
      console.error("Error loading analytics logs:", err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Create an initial snapshot of the day to seed chart history if empty
  const recordSnapshot = useCallback(async (stats: {
    total_leads: number;
    new_leads: number;
    checked: number;
    contacted: number;
    proposals_sent: number;
    closed_won: number;
    revenue_pipeline: number;
  }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('analytics_snapshots')
        .upsert({
          date: today,
          ...stats
        }, { onConflict: 'date' });

      if (error) throw error;
      fetchAnalyticsData();
    } catch (err) {
      console.error("Failed to record analytics snapshot:", err);
    }
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();
    // Auto-refresh stats every 60 seconds
    const interval = setInterval(fetchAnalyticsData, 60000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  return {
    outreachLogs,
    snapshots,
    loading,
    fetchAnalyticsData,
    recordSnapshot
  };
}
