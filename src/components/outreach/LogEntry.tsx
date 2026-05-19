import React from 'react';
import { Mail, Phone, MessageSquare, ChevronRight } from 'lucide-react';
import { OutreachEntry } from '../../hooks/useAnalytics';

interface LogEntryProps {
  log: OutreachEntry;
  index: number;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log, index }) => {
  const icons = {
    email: <Mail className="w-4 h-4 text-[#00D4FF]" />,
    phone: <Phone className="w-4 h-4 text-[#FFB800]" />,
    social: <MessageSquare className="w-4 h-4 text-purple-500" />
  };

  const outcomes = {
    no_reply: { label: 'NO REPLY', style: 'text-neutral-500 border-neutral-800 bg-neutral-900/40' },
    interested: { label: 'INTERESTED', style: 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/5 shadow-[0_0_8px_rgba(57,255,20,0.1)]' },
    rejected: { label: 'REJECTED', style: 'text-[#FF3366] border-[#FF3366]/30 bg-[#FF3366]/5 shadow-[0_0_8px_rgba(255,51,102,0.1)]' },
    booked: { label: 'MEETING BOOKED', style: 'text-[#00D4FF] border-[#00D4FF]/30 bg-[#00D4FF]/5 shadow-[0_0_8px_rgba(0,212,255,0.1)]' }
  };

  const outcomeInfo = outcomes[log.outcome] || { label: log.outcome.toUpperCase(), style: 'text-white border-neutral-700' };

  return (
    <div 
      className="relative flex items-center justify-between p-4 bg-[#080C18]/85 border border-[#00D4FF]/10 rounded-md hover:border-[#00D4FF]/30 transition-all duration-300 font-mono select-none"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-center gap-4 flex-1 pr-6">
        <div className="w-9 h-9 rounded bg-[#0A0D1A] border border-[#00D4FF]/15 flex items-center justify-center shrink-0">
          {icons[log.channel] || <Mail className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-extrabold text-white uppercase tracking-wider">
            {log.leads?.company_name || 'UNKNOWN DESTINATION NODE'}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed max-w-2xl italic">
            "{log.message}"
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-6">
        <span className={`text-[8px] px-2.5 py-1 border rounded font-extrabold tracking-widest ${outcomeInfo.style}`}>
          {outcomeInfo.label}
        </span>
        <div className="text-right">
          <div className="text-[10px] font-bold text-neutral-300 leading-none">
            {new Date(log.sent_at).toLocaleDateString()}
          </div>
          <div className="text-[8px] text-neutral-600 font-mono font-bold mt-1 tracking-widest uppercase">
            {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
