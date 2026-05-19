import React, { useState, useEffect, useMemo } from 'react';
import { Database, Shield, Sparkles, Copy, Check, Star, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface ScrapedLead {
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
  crm_status: 'new';
  notes: string;
  source_query?: string;
  service_pitched?: string;
}

interface ResultsPanelProps {
  results: ScrapedLead[];
  onCommit: () => void;
  committing: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  onCommit,
  committing
}) => {
  const [selectedPitchLead, setSelectedPitchLead] = useState<ScrapedLead | null>(null);
  const [template, setTemplate] = useState<'seo' | 'redesign' | 'ads'>('seo');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

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
      <div className="flex flex-col items-center gap-1 select-none font-mono">
        <div className="flex gap-0.5">
          {segments.map((seg) => {
            const isFilled = seg <= filledCount;
            return (
              <div
                key={seg}
                className={`h-2.5 w-1.5 rounded-sm transition-all duration-500 ${
                  isFilled ? `${color} ${glowClass}` : 'bg-neutral-800'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[8px] text-neutral-500 font-bold">{score} PTS</span>
      </div>
    );
  };

  const templates = useMemo(() => {
    if (!selectedPitchLead) return { seo: { s: '', b: '' }, redesign: { s: '', b: '' }, ads: { s: '', b: '' } };

    const lead = selectedPitchLead;
    const gapsString = lead.gaps && lead.gaps.length > 0 
      ? lead.gaps.join(', ') 
      : 'SEO optimization and speed updates';

    return {
      seo: {
        s: `Critical SEO Gaps Detected on ${lead.company_name}`,
        b: `Hi Team at ${lead.company_name},\n\nI was reviewing local businesses in ${lead.location} and ran a technical performance scan on your website.\n\nOur system detected some critical SEO gaps that are likely making you invisible to potential customers in the area:\n- SEO Score: ${lead.seo_score || 35}/100\n- Identified Vulnerabilities: ${lead.notes || 'Weak meta markup'}\n\nWith these errors, Google has difficulty crawling your pages. We specialize in fixing exactly these issues. Would you be open to a quick 5-minute call this Thursday to review our suggestions?\n\nBest regards,\n[Your Name]`
      },
      redesign: {
        s: `Proposal: Website Speed & SSL Upgrade for ${lead.company_name}`,
        b: `Hi Team,\n\nI came across ${lead.company_name} online and noticed a few features on your website that might be turning mobile visitors away:\n- Speed Index: ${lead.site_speed || 'Slow'}\n- CMS Platform: ${lead.platform || 'Wix/GoDaddy'}\n- SSL Security: ${lead.ssl_status || 'Invalid'}\n\nOur simulator predicts these performance gaps are costing you roughly $${(lead.est_revenue_loss || 1200).toLocaleString()}/month in lost customer opportunities.\n\nWe design lighting-fast, secure websites that convert. Can I send you a 2-minute video mockup of what a redesigned site would look like for ${lead.company_name}?\n\nSincerely,\n[Your Name]`
      },
      ads: {
        s: `Unlocking New Traffic for ${lead.company_name}`,
        b: `Hello,\n\nI noticed that ${lead.company_name} has a strong reputation in ${lead.location} with ${lead.review_count || 0} positive reviews. However, our ad trackers show you don't have active retargeting pixels installed.\n\nThis means you're paying to drive traffic to your site, but letting 98% of those prospects leave without showing them follow-up ads on Google or Facebook.\n\nWe build custom high-ROI ad campaigns tailored for ${lead.niche}. Let me know if you have time for a brief chat to see how we can set this up for you.\n\nRegards,\n[Your Name]`
      }
    };
  }, [selectedPitchLead]);

  useEffect(() => {
    if (selectedPitchLead) {
      setSubject(templates[template].s);
      setBody(templates[template].b);
    }
  }, [template, selectedPitchLead, templates]);

  if (results.length === 0) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    showToast("Pitch copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tactical-glass p-5 border-[#00D4FF]/15 space-y-4 select-none font-mono">
      <div className="flex justify-between items-center border-b border-[#00D4FF]/10 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#39FF14]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scrape Ingestion Buffer ({results.length} Nodes Found)</h3>
        </div>
        <Button variant="green" size="sm" onClick={onCommit} loading={committing}>
          <Database className="w-3.5 h-3.5" /> Commit Ingested Logs to Supabase
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-[#00D4FF]/10 text-neutral-500 font-extrabold uppercase">
              <th className="py-2 pr-4">Business Entity</th>
              <th className="py-2 px-4">City</th>
              <th className="py-2 px-4 text-center">Rating</th>
              <th className="py-2 px-4 text-center">AI Rating</th>
              <th className="py-2 px-4 text-center">Temp</th>
              <th className="py-2 px-4 text-center">SEO</th>
              <th className="py-2 px-4">Gaps Detected</th>
              <th className="py-2 px-4 text-right">Est. Loss</th>
              <th className="py-2 px-4 text-center">SSL</th>
              <th className="py-2 px-4 text-center">Speed</th>
              <th className="py-2 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00D4FF]/5 text-neutral-300 font-semibold">
            {results.map((r, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 pr-4">
                  <div className="font-extrabold text-white uppercase">{r.company_name}</div>
                  <div className="text-[8px] text-neutral-500 uppercase">{r.niche}</div>
                </td>
                <td className="py-2.5 px-4 uppercase">{r.location}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-black/45 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                    <Star className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]/20" />
                    {r.rating > 0 ? `${r.rating} (${r.review_count})` : 'N/A'}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  {renderSegmentedScore(r.ai_score)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest ${tempGlows[r.opportunity_temp] || 'bg-neutral-800 text-white'}`}>
                    {r.opportunity_temp}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center font-mono">
                  <span className={`font-extrabold ${r.seo_score >= 70 ? 'text-[#39FF14]' : r.seo_score >= 40 ? 'text-[#FFB800]' : 'text-[#FF3366]'}`}>
                    {r.seo_score}/100
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {(r.gaps || []).map((g) => {
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
                </td>
                <td className="py-2.5 px-4 text-right text-[#FFB800] font-bold">
                  ${(r.est_revenue_loss || 0).toLocaleString()}/mo
                </td>
                <td className="py-2.5 px-4 text-center">
                  {(r.ssl_status || '').toLowerCase().includes('valid') || (r.ssl_status || '').toLowerCase().includes('active') ? (
                    <span className="text-[#39FF14] font-extrabold">SECURE</span>
                  ) : (
                    <span className="text-[#FF3366] font-extrabold">FAIL</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className={(r.site_speed || '').includes('Fast') || (r.site_speed || '').includes('A') ? 'text-[#39FF14] font-extrabold' : 'text-[#FF3366] font-extrabold'}>
                    {(r.site_speed || 'N/A').toUpperCase()}
                  </span>
                </td>
                <td className="py-2.5 pl-4 text-right">
                  <button
                    onClick={() => setSelectedPitchLead(r)}
                    className="shimmer-btn bg-neutral-900 border border-[#00D4FF]/25 hover:bg-[#00D4FF] hover:text-[#080C18] text-[#00D4FF] px-2.5 py-1 rounded text-[9px] font-mono font-extrabold uppercase transition-all duration-300 flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    <Sparkles className="w-2.5 h-2.5 fill-current" /> Pitch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Glassy Modal for Previewing AI Pitch of Scraped Leads */}
      {selectedPitchLead && (
        <Modal
          isOpen={!!selectedPitchLead}
          onClose={() => setSelectedPitchLead(null)}
          title="PRE-INGESTION AI OUTREACH PITCH GENERATOR"
          subtitle={`LEAD: ${selectedPitchLead.company_name}`}
          maxWidth="max-w-[650px]"
        >
          <div className="p-6 space-y-4 font-mono text-[11px] select-none">
            {/* Template Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Select AI Angle Template</label>
              <div className="grid grid-cols-3 gap-2">
                {(['seo', 'redesign', 'ads'] as const).map((t) => {
                  const active = template === t;
                  const labels = {
                    seo: 'SEO Audit',
                    redesign: 'Redesign Red',
                    ads: 'Traffic Ads'
                  };
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={`py-2 border rounded font-bold cursor-pointer transition-all duration-300 text-center ${
                        active
                          ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.1)]'
                          : 'border-neutral-800 text-neutral-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                      {labels[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email subject input */}
            <div className="space-y-1">
              <label className="text-[9px] text-[#00D4FF] font-extrabold uppercase tracking-widest block">Email Subject Line</label>
              <input
                type="text"
                className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Email body textarea */}
            <div className="space-y-1">
              <label className="text-[9px] text-neutral-455 font-extrabold uppercase tracking-widest block">Email Body Text</label>
              <textarea
                className="bg-black/60 border border-[#00D4FF]/25 w-full h-[200px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none resize-none select-text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Hint message */}
            <div className="text-[9px] text-[#FFB800]/80 bg-[#FFB800]/5 border border-[#FFB800]/25 rounded p-2 text-center uppercase tracking-wider font-extrabold">
              ⚠️ Ingest this lead to Supabase to enable direct pipeline outreach tracking and broadcast actions.
            </div>

            {/* Action Buttons Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-[#00D4FF]/10">
              <button 
                onClick={handleCopy}
                className="bg-neutral-900 border border-neutral-800 hover:border-[#00D4FF]/50 text-neutral-400 hover:text-white px-3.5 py-2 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Pitch Clipboard
              </button>
              
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setSelectedPitchLead(null)}>
                  Close
                </Button>
                <Button type="button" variant="green" onClick={onCommit}>
                  Commit & Ingest Log
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
