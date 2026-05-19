import React, { useMemo } from 'react';
import { 
  Building2, Activity, Zap, Star, Shield, ArrowUpRight, Check 
} from 'lucide-react';
import { Lead } from '../hooks/useLeads';
import { OutreachEntry, AnalyticsSnapshot } from '../hooks/useAnalytics';
import { KPICard } from '../components/dashboard/KPICard';
import { FunnelChart } from '../components/dashboard/FunnelChart';
import { AreaChart } from '../components/dashboard/AreaChart';
import { GapChart } from '../components/dashboard/GapChart';
import { Badge } from '../components/ui/Badge';

interface DashboardProps {
  leads: Lead[];
  outreachLogs: OutreachEntry[];
  snapshots: AnalyticsSnapshot[];
  onSelectLead: (lead: Lead) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  outreachLogs,
  snapshots,
  onSelectLead
}) => {
  // KPI Calculations
  const stats = useMemo(() => {
    const total = leads.length;
    const checked = leads.filter(l => l.crm_status !== 'new').length;
    const contacted = leads.filter(l => ['contacted', 'proposal', 'closed_won', 'closed_lost'].includes(l.crm_status)).length;
    const won = leads.filter(l => l.crm_status === 'closed_won').length;
    const pipelineVal = leads
      .filter(l => l.crm_status !== 'closed_lost' && l.crm_status !== 'closed_won')
      .reduce((sum, l) => sum + (l.deal_value_max || 0), 0);

    const checkedPct = total > 0 ? Math.round((checked / total) * 100) : 0;
    const contactedPct = total > 0 ? Math.round((contacted / total) * 100) : 0;

    return {
      total,
      checkedPct,
      contactedPct,
      won,
      pipelineVal
    };
  }, [leads]);

  // Gap Calculations
  const gapStats = useMemo(() => {
    let seo = 0, social = 0, email = 0, ads = 0, web = 0;
    leads.forEach(l => {
      if (l.gaps.includes('SEO')) seo++;
      if (l.gaps.includes('SOCIAL')) social++;
      if (l.gaps.includes('EMAIL')) email++;
      if (l.gaps.includes('ADS')) ads++;
      if (l.gaps.includes('WEB')) web++;
    });
    return { 
      seoCount: seo, 
      socialCount: social, 
      emailCount: email, 
      adsCount: ads, 
      webCount: web 
    };
  }, [leads]);

  // Top leads by AI Score (not won or lost or proposal)
  const topLeads = useMemo(() => {
    return [...leads]
      .filter(l => !['closed_won', 'closed_lost', 'proposal'].includes(l.crm_status))
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, 5);
  }, [leads]);

  // Stage counts for Funnel
  const funnelStats = useMemo(() => {
    return {
      newCount: leads.filter(l => l.crm_status === 'new').length,
      checkedCount: leads.filter(l => l.crm_status === 'checked').length,
      contactedCount: leads.filter(l => l.crm_status === 'contacted').length,
      proposalCount: leads.filter(l => l.crm_status === 'proposal').length,
      wonCount: leads.filter(l => l.crm_status === 'closed_won').length,
    };
  }, [leads]);

  // Mock area chart timeline data if database snapshots are empty
  const chartData = useMemo(() => {
    if (snapshots.length > 0) return snapshots;
    
    // Fallback seed timeline if empty
    return Array.from({ length: 15 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (14 - idx));
      return {
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        total_leads: Math.min(leads.length, Math.round((idx + 1) * (leads.length / 15))),
        closed_won: Math.min(stats.won, Math.round((idx + 1) * (stats.won / 15)))
      };
    });
  }, [snapshots, leads.length, stats.won]);

  return (
    <div className="space-y-6">
      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard title="INTELLIGENCE INDEXED" value={stats.total} variant="cyan" />
        <KPICard title="AUDIT COMPLETION" value={stats.checkedPct} suffix="%" variant="amber" />
        <KPICard title="OUTREACH RATE" value={stats.contactedPct} suffix="%" variant="cyan" />
        <KPICard title="WON CONTRACTS" value={stats.won} variant="green" />
        <KPICard title="PIPELINE VALUE" value={stats.pipelineVal} prefix="$" variant="green" />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CRM Funnel */}
        <div className="tactical-glass p-5 border-[#00D4FF]/15 flex flex-col justify-between">
          <div className="text-[10px] text-neutral-450 font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#00D4FF]" /> INGESTION PIPELINE FUNNEL
          </div>
          <FunnelChart {...funnelStats} />
        </div>

        {/* Area Chart */}
        <div className="tactical-glass p-5 border-[#00D4FF]/15 flex flex-col justify-between">
          <div className="text-[10px] text-neutral-450 font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00D4FF]" /> INDEX SCAN DEVELOPMENT (30D)
          </div>
          <AreaChart data={chartData} />
        </div>

        {/* Gap Chart */}
        <div className="tactical-glass p-5 border-[#00D4FF]/15 flex flex-col justify-between">
          <div className="text-[10px] text-neutral-450 font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#39FF14]" /> VULNERABILITY MATRIX ANALYSIS
          </div>
          <GapChart {...gapStats} />
        </div>
      </div>

      {/* RECENT ACTIVITY & TOP LEADS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Scoring Leads */}
        <div className="tactical-glass p-5 border-[#00D4FF]/15 font-mono select-none flex flex-col justify-between">
          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-4 flex justify-between items-center border-b border-[#00D4FF]/10 pb-2">
            <span>🚀 Top Vulnerability Lead Decoders</span>
            <span className="text-[#39FF14] text-[9px] font-extrabold uppercase">High Priority</span>
          </div>
          
          <div className="space-y-3.5 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {topLeads.length > 0 ? (
              topLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  onClick={() => onSelectLead(lead)}
                  className="flex items-center justify-between p-3 border border-neutral-800 bg-[#080C18]/60 hover:border-[#00D4FF]/30 transition-all rounded cursor-pointer"
                >
                  <div>
                    <h5 className="text-[11px] font-extrabold text-white uppercase">{lead.company_name}</h5>
                    <div className="text-[8px] text-neutral-500 mt-1 uppercase">{lead.niche} // {lead.location}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#39FF14] text-xs font-extrabold">{lead.ai_score} PTS</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-neutral-500 text-[10.5px] italic py-8">
                No high priority nodes remaining.
              </div>
            )}
          </div>
        </div>

        {/* Recent Outreach activity log */}
        <div className="tactical-glass p-5 border-[#00D4FF]/15 font-mono select-none flex flex-col justify-between">
          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-4 flex justify-between items-center border-b border-[#00D4FF]/10 pb-2">
            <span>📞 Recent System Communications</span>
            <span className="text-[#00D4FF] text-[9px] font-extrabold uppercase">Live Feed</span>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {outreachLogs.length > 0 ? (
              outreachLogs.slice(0, 5).map((log) => {
                const colors = {
                  no_reply: 'text-neutral-500',
                  interested: 'text-[#39FF14] font-extrabold',
                  rejected: 'text-[#FF3366]',
                  booked: 'text-[#00D4FF] font-extrabold'
                };
                return (
                  <div key={log.id} className="flex justify-between items-start p-3 border border-neutral-800 bg-[#080C18]/60 rounded">
                    <div>
                      <div className="text-[10px] font-extrabold text-white uppercase">
                        {log.leads?.company_name || 'UNKNOWN NODE'}
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-1 italic truncate max-w-sm">"{log.message}"</p>
                    </div>
                    <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded border border-current ${colors[log.outcome] || 'text-white'}`}>
                      {log.outcome}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-center text-neutral-500 text-[10.5px] italic py-8">
                Communications silent. No outreach logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
