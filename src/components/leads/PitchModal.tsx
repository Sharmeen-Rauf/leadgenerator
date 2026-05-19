import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Copy, Check, Send } from 'lucide-react';
import { Lead } from '../../hooks/useLeads';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface PitchModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLogOutreach: (
    leadId: string,
    channel: 'email' | 'phone' | 'social',
    message: string,
    outcome: 'no_reply' | 'interested' | 'rejected' | 'booked'
  ) => Promise<void>;
  updateLeadStatus: (leadId: string, status: Lead['crm_status']) => void;
}

export const PitchModal: React.FC<PitchModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLogOutreach,
  updateLeadStatus
}) => {
  const [template, setTemplate] = useState<'seo' | 'redesign' | 'ads'>('seo');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const templates = useMemo(() => {
    if (!lead) return { seo: { s: '', b: '' }, redesign: { s: '', b: '' }, ads: { s: '', b: '' } };

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
  }, [lead]);

  // Load selected template into state
  useEffect(() => {
    if (lead) {
      setSubject(templates[template].s);
      setBody(templates[template].b);
    }
  }, [template, lead, templates]);

  if (!lead) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    showToast("Pitch copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendLog = async () => {
    setSending(true);
    try {
      const fullText = `Subject: ${subject}\n\n${body}`;
      // Log in outreach log
      await onLogOutreach(lead.id, 'email', fullText, 'no_reply');
      // Update CRM status to 'contacted'
      await updateLeadStatus(lead.id, 'contacted');
      showToast("Email pitch logged as sent", "success");
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to log email: " + err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI OUTREACH PITCH GENERATOR"
      subtitle={`LEAD: ${lead.company_name}`}
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
            className="bg-black/60 border border-[#00D4FF]/25 w-full h-[220px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none resize-none select-text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
              Close
            </Button>
            <Button type="button" variant="cyan" onClick={handleSendLog} loading={sending}>
              <Send className="w-3.5 h-3.5" /> Log as Broadcast Sent
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
