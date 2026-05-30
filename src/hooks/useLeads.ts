import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export interface Lead {
  id: string;
  company_name: string;
  niche: string;
  location: string;
  rating: number;
  review_count: number;
  phone: string;
  email: string;
  website: string;
  ai_score: number;
  opportunity_temp: 'cold' | 'warm' | 'hot';
  gaps: string[];
  est_revenue_loss: number;
  deal_value_min: number;
  deal_value_max: number;
  platform: string;
  site_speed: string;
  ssl_status: string;
  seo_score: number;
  vulnerabilities: string[];
  crm_status: 'new' | 'checked' | 'contacted' | 'proposal' | 'closed_won' | 'closed_lost';
  notes: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
  source_query?: string;
  service_pitched?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) {
        throw sbError;
      }
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message || "Failed to fetch leads");
      showToast("Error loading leads from Supabase. Ensure schema is set up.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateLeadStatus = useCallback(async (leadId: string, status: Lead['crm_status']) => {
    // Optimistic UI Update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, crm_status: status } : l))
    );

    try {
      const { error: sbError } = await supabase
        .from('leads')
        .update({ crm_status: status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (sbError) throw sbError;
      showToast(`Lead status updated to ${status.toUpperCase()}`, "success");
    } catch (err: any) {
      console.error("Error updating status:", err);
      showToast("Failed to update lead status in database", "error");
      // Revert if failed
      fetchLeads();
    }
  }, [fetchLeads, showToast]);

  const updateLeadNotes = useCallback(async (leadId: string, notes: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, notes } : l))
    );

    try {
      const { error: sbError } = await supabase
        .from('leads')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (sbError) throw sbError;
      showToast("Notes saved successfully", "success");
    } catch (err: any) {
      console.error("Error updating notes:", err);
      showToast("Failed to save notes to database", "error");
    }
  }, [showToast]);

  const logOutreach = useCallback(async (
    leadId: string, 
    channel: 'email' | 'phone' | 'social', 
    message: string, 
    outcome: 'no_reply' | 'interested' | 'rejected' | 'booked'
  ) => {
    try {
      const timestamp = new Date().toISOString();
      
      // 1. Insert into outreach_log
      const { error: logError } = await supabase
        .from('outreach_log')
        .insert({
          lead_id: leadId,
          channel,
          message,
          outcome,
          sent_at: timestamp
        });

      if (logError) throw logError;

      // 2. Update lead's crm_status to 'contacted' and last_contacted date
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          crm_status: 'contacted',
          last_contacted: timestamp,
          updated_at: timestamp
        })
        .eq('id', leadId);

      if (leadError) throw leadError;

      showToast("Outreach logged and lead updated to Contacted", "success");
      fetchLeads(); // Refresh leads to update counts
    } catch (err: any) {
      console.error("Error logging outreach:", err);
      showToast("Failed to log outreach activity", "error");
    }
  }, [fetchLeads, showToast]);

  const addLeads = useCallback(async (newLeadsList: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      // Map to only include fields that exist in the database schema to avoid 
      // PostgREST errors for client-side extra fields (like icpScore or mx_verified)
      const sanitizedLeads = newLeadsList.map(l => {
        const clean: any = {
          company_name: l.company_name || 'Unknown Business',
          niche: l.niche || 'N/A',
          location: l.location || 'N/A',
          rating: Number(l.rating) || 0,
          review_count: Number(l.review_count) || 0,
          phone: l.phone || 'N/A',
          email: l.email || 'N/A',
          website: l.website || 'N/A',
          ai_score: Number(l.ai_score) || 0,
          opportunity_temp: l.opportunity_temp || 'cold',
          gaps: l.gaps || [],
          est_revenue_loss: Number(l.est_revenue_loss) || 0,
          deal_value_min: Number(l.deal_value_min) || 0,
          deal_value_max: Number(l.deal_value_max) || 0,
          platform: l.platform || 'N/A',
          site_speed: l.site_speed || 'N/A',
          ssl_status: l.ssl_status || 'N/A',
          seo_score: Number(l.seo_score) || 0,
          vulnerabilities: l.vulnerabilities || [],
          crm_status: l.crm_status || 'new',
          notes: l.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (l.source_query !== undefined) clean.source_query = l.source_query;
        if (l.service_pitched !== undefined) clean.service_pitched = l.service_pitched;

        return clean;
      });

      const { data, error: sbError } = await supabase
        .from('leads')
        .insert(sanitizedLeads)
        .select();

      if (sbError) throw sbError;
      showToast(`Scraped and saved ${data?.length || 0} leads to Supabase`, "success");
      fetchLeads();
      return data;
    } catch (err: any) {
      console.error("Error adding leads:", err);
      showToast(`Failed to save leads: ${err.message || 'connection issue'}`, "error");
      return null;
    }
  }, [fetchLeads, showToast]);

  const enrichLead = useCallback(async (leadId: string) => {
    try {
      const leadToEnrich = leads.find(l => l.id === leadId);
      if (!leadToEnrich) return;

      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyName: leadToEnrich.company_name, 
          website: leadToEnrich.website,
          city: leadToEnrich.location 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrichment API failed");

      // Extract and merge fields
      let decisionMaker = data.decisionMaker && data.decisionMaker !== 'N/A' ? data.decisionMaker : 'N/A';
      let title = data.title && data.title !== 'Owner / Founder' ? data.title : 'Owner / Founder';
      let linkedinUrl = data.linkedinUrl && data.linkedinUrl !== 'N/A' ? data.linkedinUrl : 'N/A';
      let facebookUrl = 'N/A';
      let instagramUrl = 'N/A';
      let placeUrl = 'N/A';
      let otherNotes: string[] = [];

      if (leadToEnrich.notes) {
        const lines = leadToEnrich.notes.split('\n');
        lines.forEach(line => {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('Facebook:')) {
            facebookUrl = cleanLine.replace('Facebook:', '').trim();
          } else if (cleanLine.startsWith('Instagram:')) {
            instagramUrl = cleanLine.replace('Instagram:', '').trim();
          } else if (cleanLine.startsWith('Google Maps:')) {
            placeUrl = cleanLine.replace('Google Maps:', '').trim();
          } else if (cleanLine.startsWith('Decision Maker:') && decisionMaker === 'N/A') {
            decisionMaker = cleanLine.replace('Decision Maker:', '').trim();
          } else if (cleanLine.startsWith('Title:') && title === 'Owner / Founder') {
            title = cleanLine.replace('Title:', '').trim();
          } else if (cleanLine.startsWith('LinkedIn:') && linkedinUrl === 'N/A') {
            linkedinUrl = cleanLine.replace('LinkedIn:', '').trim();
          } else if (
            !cleanLine.startsWith('Decision Maker:') &&
            !cleanLine.startsWith('Title:') &&
            !cleanLine.startsWith('Facebook:') &&
            !cleanLine.startsWith('Instagram:') &&
            !cleanLine.startsWith('LinkedIn:') &&
            !cleanLine.startsWith('Google Maps:') &&
            !cleanLine.startsWith('Active Ads:') &&
            !cleanLine.startsWith('Enriched contact:')
          ) {
            if (cleanLine) {
              otherNotes.push(cleanLine);
            }
          }
        });
      }

      const notesLines = [
        `Decision Maker: ${decisionMaker}`,
        `Title: ${title}`,
        `Facebook: ${facebookUrl}`,
        `Instagram: ${instagramUrl}`,
        `LinkedIn: ${linkedinUrl}`,
        `Google Maps: ${placeUrl}`,
        `Active Ads: ${data.hasActiveAds ? `Active (${data.adCount || 0} ads)` : 'No Ads'}`,
        ...otherNotes
      ];
      
      const updateData = {
        email: data.directEmail && data.directEmail !== 'N/A' ? data.directEmail : leadToEnrich.email,
        phone: data.phone && data.phone !== 'N/A' ? data.phone : leadToEnrich.phone,
        notes: notesLines.join('\n'),
        updated_at: new Date().toISOString()
      };

      const { error: sbError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (sbError) throw sbError;

      showToast("Lead enrichment successful", "success");
      fetchLeads();
    } catch (err: any) {
      console.error("Error enriching lead:", err);
      showToast("Enrichment failed: " + err.message, "error");
    }
  }, [leads, fetchLeads, showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    updateLeadStatus,
    updateLeadNotes,
    logOutreach,
    addLeads,
    enrichLead
  };
}
