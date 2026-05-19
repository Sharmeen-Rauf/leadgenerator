import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, Plus, Award, Activity, Trash2, CheckCircle2, 
  PauseCircle, AlertTriangle, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Lead } from '../hooks/useLeads';

export interface Campaign {
  id: string;
  name: string;
  niche: string;
  location: string;
  service: string;
  total_leads: number;
  created_at: string;
  status: 'active' | 'paused' | 'completed';
}

interface CampaignsProps {
  leads: Lead[];
}

export const Campaigns: React.FC<CampaignsProps> = ({ leads }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [service, setService] = useState('SEO Audit & Optimization');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load campaigns from Supabase.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      // Calculate matching leads in database
      const matchingCount = leads.filter(l => 
        (niche ? l.niche.toLowerCase().includes(niche.toLowerCase()) : true) &&
        (location ? l.location.toLowerCase().includes(location.toLowerCase()) : true)
      ).length;

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          niche: niche || 'All Niches',
          location: location || 'All Locations',
          service,
          total_leads: matchingCount,
          status: 'active'
        })
        .select();

      if (error) throw error;

      showToast(`Campaign "${name}" initialized successfully`, "success");
      setIsModalOpen(false);
      setName('');
      setNiche('');
      setLocation('');
      setService('SEO Audit & Optimization');
      fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to create campaign: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Campaign['status']) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showToast(`Campaign status updated to ${newStatus.toUpperCase()}`, "success");
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      console.error(err);
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to purge this campaign folder?")) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast("Campaign purged from database", "success");
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error(err);
      showToast("Purge execution failed", "error");
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const statusIcons = {
    active: <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />,
    paused: <PauseCircle className="w-4 h-4 text-[#FFB800]" />,
    completed: <Award className="w-4 h-4 text-[#00D4FF]" />
  };

  const statusStyles = {
    active: 'border-[#39FF14]/30 text-[#39FF14] bg-[#39FF14]/5 shadow-[0_0_8px_rgba(57,255,20,0.1)]',
    paused: 'border-[#FFB800]/30 text-[#FFB800] bg-[#FFB800]/5 shadow-[0_0_8px_rgba(255,184,0,0.1)]',
    completed: 'border-[#00D4FF]/30 text-[#00D4FF] bg-[#00D4FF]/5 shadow-[0_0_8px_rgba(0,212,255,0.1)]'
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center select-none font-mono">
        <div>
          <h2 className="text-sm font-extrabold text-white font-['Syne'] uppercase tracking-wider">Outreach Campaigns Console</h2>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">Execute and audit automated email sequences</p>
        </div>
        <Button variant="cyan" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Campaign Sequence
        </Button>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="text-center py-12 text-neutral-500 font-mono text-xs">
          Querying active sequences...
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 select-none font-mono">
          {campaigns.map((camp) => (
            <div 
              key={camp.id} 
              className="tactical-glass p-5 border-[#00D4FF]/15 hover:border-[#00D4FF]/30 transition-all duration-300 flex flex-col justify-between h-[210px]"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider leading-snug truncate max-w-[150px]">
                    {camp.name}
                  </h4>
                  <span className={`text-[8px] px-2 py-0.5 border rounded-full font-extrabold flex items-center gap-1 leading-none ${statusStyles[camp.status]}`}>
                    {statusIcons[camp.status]} {camp.status}
                  </span>
                </div>
                
                <div className="text-[8px] text-[#00D4FF] mt-2 font-bold uppercase tracking-widest">
                  Target Niche: <span className="text-neutral-450">{camp.niche}</span>
                </div>
                <div className="text-[8px] text-[#00D4FF] mt-1 font-bold uppercase tracking-widest">
                  Target City: <span className="text-neutral-450">{camp.location}</span>
                </div>

                <div className="bg-black/40 border border-neutral-900 rounded p-2.5 mt-3.5 flex justify-between items-center text-[10px]">
                  <span className="text-neutral-500 font-bold uppercase">Pitch Strategy:</span>
                  <span className="text-white font-extrabold uppercase text-right max-w-[150px] truncate">{camp.service}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 border-t border-[#00D4FF]/10 pt-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span className="text-neutral-400 font-bold uppercase">Target Size:</span>
                  <span className="text-[#00D4FF] font-extrabold">{camp.total_leads} Nodes</span>
                </div>
                
                <div className="flex gap-2">
                  {camp.status === 'active' ? (
                    <button 
                      onClick={() => handleUpdateStatus(camp.id, 'paused')}
                      className="p-1 rounded bg-neutral-950 border border-neutral-800 hover:border-[#FFB800]/50 text-neutral-400 hover:text-[#FFB800] transition-colors cursor-pointer"
                      title="Pause Sequence"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(camp.id, 'active')}
                      className="p-1 rounded bg-neutral-950 border border-neutral-800 hover:border-[#39FF14]/50 text-neutral-400 hover:text-[#39FF14] transition-colors cursor-pointer"
                      title="Resume Sequence"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="p-1 rounded bg-neutral-950 border border-neutral-800 hover:border-[#FF3366]/50 text-neutral-400 hover:text-[#FF3366] transition-colors cursor-pointer"
                    title="Purge Campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tactical-glass p-12 text-center flex flex-col items-center select-none border-[#00D4FF]/10 max-w-md mx-auto mt-12 font-mono">
          <AlertTriangle className="w-8 h-8 text-[#FFB800] mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">No Active Sequences</h4>
          <p className="text-[10px] text-neutral-500 leading-relaxed mb-5">Launch an automated sequence to broadcast SEO/Marketing audits to buffered leads.</p>
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            Create New Campaign
          </Button>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CREATE CAMPAIGN SEQUENCE"
        subtitle="Configure filters for auto-outreach targeting"
        maxWidth="max-w-[500px]"
      >
        <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 font-mono text-[11px]">
          <div className="space-y-1">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block">Campaign Identifier Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
              placeholder="e.g. DENTIST OUTREACH BOSTON"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-neutral-455 font-extrabold uppercase tracking-widest block">Filter Niche (matches category)</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
              placeholder="e.g. Dentists"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-neutral-460 font-extrabold uppercase tracking-widest block">Filter Location (matches city)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
              placeholder="e.g. Boston"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-neutral-465 font-extrabold uppercase tracking-widest block">Pitch Core Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
            >
              <option value="SEO Audit & Optimization">SEO Audit & Optimization</option>
              <option value="Web Design Redesign Package">Web Design Redesign Package</option>
              <option value="Meta & Google Ads Campaign">Meta & Google Ads Campaign</option>
              <option value="Email Marketing Automation Setup">Email Marketing Automation Setup</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#00D4FF]/10">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="cyan" loading={submitting}>
              Initialize Sequence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
