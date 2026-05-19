import React, { useState, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, Download, ArrowUpDown, ChevronDown, 
  ChevronUp, RotateCcw, AlertTriangle, Eye 
} from 'lucide-react';
import { Lead } from '../../hooks/useLeads';
import { LeadRow } from './LeadRow';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  activePage: string;
  updateLeadStatus: (leadId: string, status: Lead['crm_status']) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenPitch: (lead: Lead) => void;
  onOpenOutreachLog: (lead: Lead) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  activePage,
  updateLeadStatus,
  onSelectLead,
  onOpenPitch,
  onOpenOutreachLog
}) => {
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreRange, setScoreRange] = useState<number>(0);
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [selectedGaps, setSelectedGaps] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'loss'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(20);

  // If we are on a stage-specific page, lock the status filter to that stage!
  const currentStageFilter = useMemo(() => {
    if (activePage.startsWith('stage-')) {
      const stage = activePage.replace('stage-', '');
      if (stage === 'won') return 'closed_won';
      if (stage === 'lost') return 'closed_lost';
      return stage;
    }
    return statusFilter;
  }, [activePage, statusFilter]);

  const handleGapToggle = (gap: string) => {
    setSelectedGaps(prev => 
      prev.includes(gap) ? prev.filter(g => g !== gap) : [...prev, gap]
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setScoreRange(0);
    setTempFilter('all');
    setSelectedGaps([]);
    setSortBy('score');
    setSortOrder('desc');
  };

  // Filter & Sort logic
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Stage / Status Filter
    if (currentStageFilter !== 'all') {
      result = result.filter(l => l.crm_status === currentStageFilter);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.company_name.toLowerCase().includes(q) || 
        l.niche.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q)
      );
    }

    // AI Score Range
    if (scoreRange > 0) {
      result = result.filter(l => l.ai_score >= scoreRange);
    }

    // Opportunity Temp
    if (tempFilter !== 'all') {
      result = result.filter(l => l.opportunity_temp === tempFilter);
    }

    // Gap Types (match all selected)
    if (selectedGaps.length > 0) {
      result = result.filter(l => 
        selectedGaps.every(g => l.gaps.includes(g))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === 'score') {
        valA = a.ai_score;
        valB = b.ai_score;
      } else if (sortBy === 'date') {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else if (sortBy === 'loss') {
        valA = a.est_revenue_loss;
        valB = b.est_revenue_loss;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    return result;
  }, [leads, currentStageFilter, search, scoreRange, tempFilter, selectedGaps, sortBy, sortOrder]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice(0, pageSize);
  }, [filteredLeads, pageSize]);

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Business", "Category", "City", "Rating", "Reviews", "Phone", "Email", "Website", "AI Score", "Temp", "Gaps", "Est Loss", "Notes"];
    const rows = filteredLeads.map((l) => [
      `"${l.company_name}"`,
      `"${l.niche}"`,
      `"${l.location}"`,
      l.rating,
      l.review_count,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.website}"`,
      l.ai_score,
      `"${l.opportunity_temp}"`,
      `"${l.gaps.join(';')}"`,
      l.est_revenue_loss,
      `"${l.notes || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pitchradar_filtered_leads_${new Date().getTime()}.csv`);
    link.click();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* --- ADVANCED FILTER BAR --- */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00D4FF]/10 pb-4 mb-4 select-none">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4.5 h-4.5 text-[#00D4FF]" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Control Filter Decoders</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
              <Download className="w-3.5 h-3.5" /> Export csv
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Query Search */}
          <div className="flex flex-col gap-1.5 font-mono">
            <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">Filter by Keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-4 py-2 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all"
                placeholder="ENTER NAME / CITY / NICHE..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* CRM Status select */}
          <div className="flex flex-col gap-1.5 font-mono">
            <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">Pipeline Stage</label>
            <select
              value={currentStageFilter}
              onChange={e => setStatusFilter(e.target.value)}
              disabled={activePage.startsWith('stage-')}
              className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2 w-full text-xs outline-none text-neutral-300 font-semibold focus:border-[#00D4FF] transition-all uppercase cursor-pointer disabled:opacity-50"
            >
              <option value="all">All Stages</option>
              <option value="new">🆕 New Leads</option>
              <option value="checked">👁️ Checked</option>
              <option value="contacted">📞 Contacted</option>
              <option value="proposal">📄 Proposal Sent</option>
              <option value="closed_won">✅ Closed Won</option>
              <option value="closed_lost">❌ Closed Lost</option>
            </select>
          </div>

          {/* Temperature toggler pills */}
          <div className="flex flex-col gap-1.5 font-mono select-none">
            <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest font-mono">Opportunity Temp</label>
            <div className="flex bg-neutral-900 border border-[#00D4FF]/10 p-0.5 rounded">
              {['all', 'cold', 'warm', 'hot'].map((temp) => (
                <button
                  key={temp}
                  onClick={() => setTempFilter(temp)}
                  className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    tempFilter === temp
                      ? 'bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF]'
                      : 'text-neutral-500 hover:text-white border border-transparent'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* AI Score Slider */}
          <div className="flex flex-col gap-1.5 font-mono select-none">
            <div className="flex justify-between text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">
              <span>Min AI score</span>
              <span className="text-[#00D4FF]">{scoreRange}+</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={scoreRange}
              onChange={e => setScoreRange(parseInt(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer mt-3"
            />
          </div>
        </div>

        {/* Gap Multi-select checklist */}
        <div className="mt-4 pt-4 border-t border-[#00D4FF]/10 select-none font-mono">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">Vulnerability Gap Checklist</label>
            <div className="flex gap-2 flex-wrap">
              {['SEO', 'SOCIAL', 'EMAIL', 'ADS', 'WEB'].map((gap) => {
                const isSelected = selectedGaps.includes(gap);
                const gapColors: Record<string, string> = {
                  SEO: '#00D4FF',
                  SOCIAL: '#39FF14',
                  EMAIL: '#FFB800',
                  ADS: '#FF3366',
                  WEB: '#3B82F6'
                };
                const color = gapColors[gap];
                return (
                  <button
                    key={gap}
                    onClick={() => handleGapToggle(gap)}
                    className={`px-3 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                        : 'text-neutral-500 border-neutral-800 hover:text-white'
                    }`}
                    style={{ 
                      borderColor: isSelected ? color : undefined,
                      backgroundColor: isSelected ? `${color}15` : undefined 
                    }}
                  >
                    {gap}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sort & Order strip */}
        <div className="mt-4 pt-4 border-t border-[#00D4FF]/10 flex flex-wrap justify-between items-center gap-3 select-none font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">Sort Parameters</span>
            <div className="flex bg-neutral-950 p-0.5 rounded border border-[#00D4FF]/10">
              {(['score', 'date', 'loss'] as const).map((param) => (
                <button
                  key={param}
                  onClick={() => setSortBy(param)}
                  className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    sortBy === param
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25'
                      : 'text-neutral-500 hover:text-white border border-transparent'
                  }`}
                >
                  {param === 'score' ? 'AI Score' : param === 'date' ? 'Date Added' : 'Est Loss'}
                </button>
              ))}
            </div>
            <button 
              onClick={toggleSortOrder} 
              className="p-1 rounded bg-[#080C18] border border-[#00D4FF]/20 text-[#00D4FF] hover:border-[#00D4FF]/50 transition-all cursor-pointer"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            </button>
          </div>

          <div className="text-[10px] text-neutral-400 font-bold uppercase">
            Showing <span className="text-[#00D4FF] font-extrabold font-mono">{filteredLeads.length}</span> of <span className="text-white font-extrabold font-mono">{leads.length}</span> total logs
          </div>
        </div>
      </div>

      {/* --- TABLE CONTENT CARDS --- */}
      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3, 4].map(idx => (
            <Skeleton key={idx} className="h-20" />
          ))}
        </div>
      ) : paginatedLeads.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {paginatedLeads.map((lead, idx) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              index={idx}
              onSelect={onSelectLead}
              onOpenPitch={onOpenPitch}
              onOpenOutreachLog={onOpenOutreachLog}
              onUpdateStatus={updateLeadStatus}
            />
          ))}

          {/* Load More Pagination */}
          {filteredLeads.length > pageSize && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setPageSize(prev => prev + 20)}
              >
                Ingest Next 20 Target Logs ({filteredLeads.length - pageSize} Remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="tactical-glass p-12 text-center flex flex-col items-center select-none border-[#00D4FF]/10 max-w-xl mx-auto mt-12 font-mono">
          <AlertTriangle className="w-8 h-8 text-[#FFB800] mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Index Query Failure</h4>
          <p className="text-[10px] text-neutral-500 leading-relaxed mb-4">No records align with the defined filter queries. Recalibrate your sliders and search params.</p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};
