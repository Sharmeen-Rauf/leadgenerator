import React from 'react';
import { Star, Sparkles, MapPin, MessageSquare } from 'lucide-react';
import { Lead } from '../../hooks/useLeads';
import { Badge } from '../ui/Badge';

interface LeadRowProps {
  lead: Lead;
  index: number;
  onSelect: (lead: Lead) => void;
  onOpenPitch: (lead: Lead) => void;
  onOpenOutreachLog: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: Lead['crm_status']) => void;
}

export const LeadRow: React.FC<LeadRowProps> = ({
  lead,
  index,
  onSelect,
  onOpenPitch,
  onOpenOutreachLog,
  onUpdateStatus
}) => {
  const ribbons = {
    new: 'bg-[#00D4FF]',
    checked: 'bg-[#FFB800]',
    contacted: 'bg-orange-500',
    proposal: 'bg-purple-500',
    closed_won: 'bg-[#39FF14]',
    closed_lost: 'bg-[#FF3366]',
  };

  const tempGlows = {
    cold: 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_8px_rgba(0,212,255,0.15)]',
    warm: 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30 shadow-[0_0_8px_rgba(255,184,0,0.15)]',
    hot: 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30 shadow-[0_0_8px_rgba(255,51,102,0.15)]',
  };

  const renderSegmentedScore = (score: number) => {
    const segments = [1, 2, 3, 4, 5];
    const filledCount = Math.ceil(score / 20); // 0-5
    const color = score >= 70 ? 'bg-[#39FF14]' : score >= 40 ? 'bg-[#FFB800]' : 'bg-[#FF3366]';
    const glowClass = score >= 70 ? 'shadow-[0_0_8px_#39FF14]' : score >= 40 ? 'shadow-[0_0_8px_#FFB800]' : 'shadow-[0_0_8px_#FF3366]';

    return (
      <div className="flex flex-col gap-1 w-16 select-none font-mono">
        <div className="flex gap-0.5">
          {segments.map((seg) => {
            const isFilled = seg <= filledCount;
            return (
              <div
                key={seg}
                className={`h-2.5 w-2 rounded-sm transition-all duration-500 ${
                  isFilled ? `${color} ${glowClass}` : 'bg-neutral-800'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[9px] text-neutral-450 font-bold">{score} GAP PTS</span>
      </div>
    );
  };

  return (
    <div 
      onClick={() => onSelect(lead)}
      className="relative flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-[#080C18]/85 border border-[#00D4FF]/10 rounded-md hover:border-[#00D4FF]/45 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(0,212,255,0.08)] cursor-pointer transition-all duration-300 group select-none"
      style={{ animationDelay: `${index * 25}ms`, animationPlayState: 'running' }}
    >
      {/* Ribbon marker */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${ribbons[lead.crm_status] || 'bg-neutral-600'} rounded-l transition-colors duration-300`} />

      {/* Profile info */}
      <div className="flex-1 pr-4 min-w-[200px]">
        <div className="font-extrabold text-sm text-white group-hover:text-[#00D4FF] transition-colors leading-tight font-['Syne'] uppercase">
          {lead.company_name}
        </div>
        <div className="text-[9px] text-neutral-500 mt-1 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-[#00D4FF]" />
          <span>{lead.niche}</span>
          <span className="text-neutral-700 font-bold">//</span>
          <span>{lead.location}</span>
        </div>
      </div>

      {/* Ratings */}
      <div className="w-[120px] shrink-0 mt-3 lg:mt-0 font-mono">
        <span className="inline-flex items-center gap-1.5 bg-black/40 border border-[#00D4FF]/10 rounded px-2 py-0.5 text-[10px] font-bold text-white">
          <Star className={`w-3 h-3 ${lead.rating >= 4.0 ? 'text-[#39FF14] fill-[#39FF14]/10' : 'text-[#FFB800] fill-[#FFB800]/10'}`}/> 
          {lead.rating > 0 ? `${lead.rating} (${lead.review_count} R)` : 'NO RATINGS'}
        </span>
      </div>

      {/* Segmented Score */}
      <div className="w-[100px] shrink-0 mt-3 lg:mt-0">
        {renderSegmentedScore(lead.ai_score)}
      </div>

      {/* Temperature */}
      <div className="w-[90px] shrink-0 mt-3 lg:mt-0 font-mono">
        <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest ${tempGlows[lead.opportunity_temp] || 'bg-neutral-800 text-white'}`}>
          {lead.opportunity_temp}
        </span>
      </div>

      {/* Gaps */}
      <div className="flex-1 mt-3 lg:mt-0 pr-4">
        <div className="flex gap-1.5 flex-wrap">
          {lead.gaps.map((g) => {
            const gapColors: Record<string, 'cyan' | 'green' | 'amber' | 'pink' | 'default'> = {
              SEO: 'cyan',
              SOCIAL: 'green',
              EMAIL: 'amber',
              ADS: 'pink',
              WEB: 'default'
            };
            return (
              <Badge key={g} variant={gapColors[g] || 'default'}>
                {g}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Est Loss */}
      <div className="w-[140px] shrink-0 mt-3 lg:mt-0 font-mono">
        <div className="flex flex-col">
          <span className="text-[11px] font-extrabold text-[#FFB800] tracking-tight">
            ${(lead.est_revenue_loss || 0).toLocaleString()}/mo
          </span>
          <span className="text-[8px] text-neutral-500 uppercase tracking-widest">Est Loss</span>
        </div>
      </div>

      {/* Action panel (quick buttons fade in on hover) */}
      <div 
        className="shrink-0 mt-3 lg:mt-0 flex gap-2 items-center opacity-90 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={lead.crm_status}
          onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['crm_status'])}
          className="bg-neutral-900 border border-[#00D4FF]/25 text-[#00D4FF] hover:border-[#00D4FF]/50 text-[10px] font-mono font-extrabold rounded px-2 py-1 outline-none cursor-pointer uppercase transition-colors"
        >
          <option value="new">🆕 NEW</option>
          <option value="checked">👁️ CHECKED</option>
          <option value="contacted">📞 CONTACTED</option>
          <option value="proposal">📄 PROPOSAL</option>
          <option value="closed_won">✅ WON</option>
          <option value="closed_lost">❌ LOST</option>
        </select>

        <button
          onClick={() => onOpenPitch(lead)}
          className="shimmer-btn bg-neutral-900 border border-[#00D4FF]/25 hover:bg-[#00D4FF] hover:text-[#080C18] text-[#00D4FF] px-2.5 py-1 rounded text-[10px] font-mono font-extrabold uppercase transition-all duration-300 flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 fill-current" /> Pitch
        </button>

        <button
          onClick={() => onOpenOutreachLog(lead)}
          className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-2.5 py-1 rounded text-[10px] font-mono font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
        >
          <MessageSquare className="w-3 h-3" /> Log
        </button>
      </div>
    </div>
  );
};
