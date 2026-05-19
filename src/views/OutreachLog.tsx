import React, { useState, useMemo } from 'react';
import { Mail, Search, MessageSquare, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { OutreachEntry } from '../hooks/useAnalytics';
import { LogEntry } from '../components/outreach/LogEntry';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

interface OutreachLogProps {
  outreachLogs: OutreachEntry[];
  loading: boolean;
}

export const OutreachLog: React.FC<OutreachLogProps> = ({
  outreachLogs,
  loading
}) => {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(20);

  const filteredLogs = useMemo(() => {
    let result = [...outreachLogs];

    // Channel filter
    if (channelFilter !== 'all') {
      result = result.filter(l => l.channel === channelFilter);
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      result = result.filter(l => l.outcome === outcomeFilter);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        (l.leads?.company_name || '').toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [outreachLogs, channelFilter, outcomeFilter, search]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(0, pageSize);
  }, [filteredLogs, pageSize]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15">
        <div className="flex items-center gap-2 border-b border-[#00D4FF]/10 pb-3.5 mb-4 select-none">
          <SlidersHorizontal className="w-4.5 h-4.5 text-[#00D4FF]" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Outreach Activity Decoders</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Filter by Keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-4 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all uppercase"
                placeholder="SEARCH LEADS / TRANSCRIPTS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Channel Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Channel</label>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none text-neutral-300 font-semibold focus:border-[#00D4FF] transition-all uppercase cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="email">✉️ Email Campaigns</option>
              <option value="phone">📞 Phone Logs</option>
              <option value="social">💬 Social Outreach</option>
            </select>
          </div>

          {/* Outcome Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Outcome Status</label>
            <select
              value={outcomeFilter}
              onChange={e => setOutcomeFilter(e.target.value)}
              className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none text-neutral-300 font-semibold focus:border-[#00D4FF] transition-all uppercase cursor-pointer"
            >
              <option value="all">All Outcomes</option>
              <option value="no_reply">❓ No Reply</option>
              <option value="interested">👍 Interested</option>
              <option value="rejected">👎 Rejected</option>
              <option value="booked">📅 Meeting Booked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map(idx => (
            <Skeleton key={idx} className="h-16" />
          ))}
        </div>
      ) : paginatedLogs.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {paginatedLogs.map((log, idx) => (
            <LogEntry key={log.id} log={log} index={idx} />
          ))}

          {/* Load More button */}
          {filteredLogs.length > pageSize && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setPageSize(prev => prev + 20)}
              >
                Ingest Next 20 Logs ({filteredLogs.length - pageSize} Remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="tactical-glass p-12 text-center flex flex-col items-center select-none border-[#00D4FF]/10 max-w-md mx-auto mt-12 font-mono">
          <AlertTriangle className="w-8 h-8 text-[#FFB800] mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Log Feed Empty</h4>
          <p className="text-[10px] text-neutral-500 leading-relaxed mb-5">No communication events logged matching current query. Execute outreach to populate log.</p>
        </div>
      )}
    </div>
  );
};
