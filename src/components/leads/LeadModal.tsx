import React, { useState, useEffect } from 'react';
import { 
  Globe, Mail, Phone, Calendar, Shield, Cpu, ExternalLink, 
  Save, Landmark, Activity, AlertTriangle, FileText
} from 'lucide-react';
import { Lead } from '../../hooks/useLeads';
import { ScoreGauge } from './ScoreGauge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (leadId: string, notes: string) => Promise<void>;
  outreachLogs: any[]; // logs corresponding to this lead
}

export const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveNotes,
  outreachLogs
}) => {
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
    }
  }, [lead]);

  if (!lead) return null;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onSaveNotes(lead.id, notes);
    } finally {
      setSavingNotes(false);
    }
  };

  // Filter logs for this specific lead
  const filteredLogs = outreachLogs.filter(log => log.lead_id === lead.id);

  // Speed, SSL, SEO Audit stats
  const auditScores = [
    { label: 'Site Speed', value: lead.site_speed || 'N/A', color: lead.site_speed?.includes('Slow') || lead.site_speed?.includes('F') ? 'text-[#FF3366]' : 'text-[#39FF14]' },
    { label: 'SSL Status', value: lead.ssl_status || 'N/A', color: lead.ssl_status?.toLowerCase().includes('valid') || lead.ssl_status?.toLowerCase().includes('active') ? 'text-[#39FF14]' : 'text-[#FF3366]' },
    { label: 'SEO Score', value: lead.seo_score ? `${lead.seo_score}/100` : 'N/A', color: (lead.seo_score || 0) >= 80 ? 'text-[#39FF14]' : (lead.seo_score || 0) >= 50 ? 'text-[#FFB800]' : 'text-[#FF3366]' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DEEP AUDIT SCAN REPORT"
      subtitle={`LEAD_ID: ${lead.id}`}
      maxWidth="max-w-[1000px]"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#00D4FF]/10 h-full font-mono text-[11px]">
        {/* LEFT COLUMN: Firmographics & Gaps & Notes */}
        <div className="md:col-span-7 p-6 space-y-6 overflow-y-auto">
          {/* Company Identity */}
          <div>
            <div className="text-[17px] font-['Syne'] font-extrabold text-white tracking-wider uppercase leading-snug">
              {lead.company_name}
            </div>
            <div className="text-[9px] text-[#00D4FF] mt-1 font-bold uppercase tracking-widest flex items-center gap-1">
              <span>{lead.niche}</span>
              <span className="text-neutral-700">//</span>
              <span>{lead.location}</span>
            </div>
          </div>

          {/* Firmographic stats */}
          <div className="grid grid-cols-2 gap-4 bg-black/40 border border-[#00D4FF]/10 rounded-md p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">Website URL</span>
              {lead.website && lead.website !== 'N/A' && lead.website !== 'null' ? (
                <a 
                  href={lead.website} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-white hover:text-[#00D4FF] hover:underline flex items-center gap-1 truncate font-bold"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" /> {lead.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              ) : (
                <span className="text-neutral-500 font-bold">N/A</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">Contact Email</span>
              {lead.email && lead.email !== 'N/A' && lead.email !== 'null' ? (
                <a href={`mailto:${lead.email}`} className="text-white hover:text-[#00D4FF] flex items-center gap-1 truncate font-bold">
                  <Mail className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" /> {lead.email}
                </a>
              ) : (
                <span className="text-neutral-500 font-bold">N/A</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">Direct Phone</span>
              {lead.phone && lead.phone !== 'N/A' && lead.phone !== 'null' ? (
                <a href={`tel:${lead.phone}`} className="text-white hover:text-[#00D4FF] flex items-center gap-1 truncate font-bold">
                  <Phone className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" /> {lead.phone}
                </a>
              ) : (
                <span className="text-neutral-500 font-bold">N/A</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-wider">Source Query</span>
              <span className="text-neutral-400 font-bold uppercase truncate">{lead.source_query || 'DIRECT SCRAPE'}</span>
            </div>
          </div>

          {/* Vulns / Flaws Detected */}
          <div className="space-y-2.5">
            <h4 className="text-[9px] text-[#FF3366] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#FF3366]" /> Flagged Systems Vulnerabilities
            </h4>
            
            {lead.vulnerabilities && lead.vulnerabilities.length > 0 ? (
              <ul className="space-y-1.5 pl-1.5 border-l border-[#FF3366]/20">
                {lead.vulnerabilities.map((v, idx) => (
                  <li key={idx} className="text-neutral-300 text-[10px] flex items-start gap-2 leading-relaxed">
                    <span className="text-[#FF3366] font-bold">»</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[10px] text-neutral-500">No flags raised in initial database scans.</div>
            )}
          </div>

          {/* CRM Notes */}
          <div className="space-y-2.5 select-none">
            <h4 className="text-[9px] text-white font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#00D4FF]" /> Analyst System Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-black/60 border border-[#00D4FF]/25 w-full h-[150px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all placeholder-neutral-600 resize-none"
              placeholder="ENTER ANALYST NOTES HERE..."
            />
            <div className="flex justify-end">
              <Button variant="green" size="sm" onClick={handleSaveNotes} loading={savingNotes}>
                <Save className="w-3.5 h-3.5" /> Save Notes
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Audit scores & recent outreach */}
        <div className="md:col-span-5 p-6 space-y-6 flex flex-col justify-between overflow-y-auto">
          {/* AI Gap Score Gauge */}
          <div className="flex justify-center border-b border-[#00D4FF]/10 pb-4">
            <ScoreGauge score={lead.ai_score} size={150} />
          </div>

          {/* Site speed / SEO/ SSL */}
          <div className="space-y-3">
            <h4 className="text-[9px] text-white font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#00D4FF]" /> Server Audit Diagnostics
            </h4>
            <div className="space-y-2 bg-[#0A0D1A]/55 border border-[#00D4FF]/10 rounded-md p-3.5">
              {auditScores.map((score, sIdx) => (
                <div key={sIdx} className="flex justify-between items-center text-[10.5px]">
                  <span className="text-neutral-400 font-bold uppercase">{score.label}</span>
                  <span className={`font-extrabold font-mono tracking-wider ${score.color}`}>{score.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach attempts Log */}
          <div className="flex-1 mt-4 space-y-3 min-h-[160px] flex flex-col">
            <h4 className="text-[9px] text-white font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#39FF14]" /> System Communication Log
            </h4>
            
            <div className="flex-1 overflow-y-auto max-h-[180px] bg-black/40 border border-[#00D4FF]/10 rounded-md p-3 space-y-3 custom-scrollbar">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const channelSymbols = { email: '✉️', phone: '📞', social: '💬' };
                  const outcomeColors = { 
                    no_reply: 'text-neutral-500', 
                    interested: 'text-[#39FF14] font-extrabold', 
                    rejected: 'text-[#FF3366]', 
                    booked: 'text-[#00D4FF] font-extrabold' 
                  };
                  return (
                    <div key={log.id} className="border-b border-[#00D4FF]/5 pb-2.5 last:border-b-0">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-white font-extrabold uppercase">{channelSymbols[log.channel as 'email'|'phone'|'social']} {log.channel}</span>
                        <span className="text-neutral-500 text-[8px]">{new Date(log.sent_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed mt-1 italic">"{log.message}"</p>
                      <div className="text-[9px] mt-1 uppercase font-bold">
                        Outcome: <span className={outcomeColors[log.outcome as 'no_reply'|'interested'|'rejected'|'booked']}>{log.outcome}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-neutral-500 text-[10px] italic py-6">
                  No outreach campaigns executed. System silent.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
