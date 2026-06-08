import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Mail, Phone, Calendar, Shield, Cpu, ExternalLink,
  Save, Activity, AlertTriangle, FileText, Star, MapPin,
  Sparkles, Copy, Check, Send, BarChart2, Users, MessageSquare,
  Target, Zap, TrendingUp, Eye, RefreshCw, Rocket, X
} from 'lucide-react';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { Lead } from '../../hooks/useLeads';
import { useToast } from '../ui/Toast';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (leadId: string, notes: string) => Promise<void>;
  outreachLogs: any[];
  onLogOutreach: (
    leadId: string,
    channel: 'email' | 'phone' | 'social',
    message: string,
    outcome: 'no_reply' | 'interested' | 'rejected' | 'booked'
  ) => Promise<void>;
  updateLeadStatus: (leadId: string, status: Lead['crm_status']) => void;
  onEnrich?: (leadId: string) => Promise<void>;
  initialTab?: 'diagnostic' | 'reviews' | 'contacts' | 'pitch' | 'plan';
}

// ---- HELPER: Derive weighted scoring breakdown from Lead data ----
function computeScoringBreakdown(lead: Lead) {
  const websiteExists = lead.website && lead.website !== 'N/A' && lead.website !== 'null';
  const seoScore = lead.seo_score || 0;
  const rating = lead.rating || 0;
  const reviews = lead.review_count || 0;
  const hasSocial = lead.gaps ? !lead.gaps.includes('SOCIAL') : true;
  const hasAds = lead.gaps ? !lead.gaps.includes('ADS') : true;
  const hasEmail = lead.gaps ? !lead.gaps.includes('EMAIL') : true;
  const hasWeb = lead.gaps ? !lead.gaps.includes('WEB') : true;

  return [
    {
      label: 'Website Issues',
      pct: websiteExists ? Math.min(40, Math.max(8, 40 - seoScore * 0.4)) : 80,
      weight: 20,
      color: websiteExists ? '#39FF14' : '#FF3366'
    },
    {
      label: 'SEO Weakness',
      pct: Math.max(5, 100 - seoScore),
      weight: 20,
      color: seoScore >= 70 ? '#39FF14' : seoScore >= 40 ? '#FFB800' : '#FF3366'
    },
    {
      label: 'Local SEO',
      pct: reviews > 50 ? 15 : reviews > 20 ? 35 : reviews > 5 ? 55 : 80,
      weight: 15,
      color: reviews > 50 ? '#39FF14' : reviews > 20 ? '#FFB800' : '#FF3366'
    },
    {
      label: 'Ads Opportunity',
      pct: hasAds ? 12 : 65,
      weight: 10,
      color: hasAds ? '#39FF14' : '#FFB800'
    },
    {
      label: 'Social Gaps',
      pct: hasSocial ? 10 : 78,
      weight: 10,
      color: hasSocial ? '#39FF14' : '#FF3366'
    },
    {
      label: 'Conversion Issues',
      pct: websiteExists ? (seoScore >= 60 ? 20 : 55) : 90,
      weight: 10,
      color: websiteExists && seoScore >= 60 ? '#FFB800' : '#FF3366'
    },
    {
      label: 'Buying Intent',
      pct: rating >= 4.5 ? 70 : rating >= 3.5 ? 45 : rating > 0 ? 20 : 5,
      weight: 10,
      color: rating >= 4.0 ? '#39FF14' : rating >= 3.0 ? '#FFB800' : '#FF3366'
    },
    {
      label: 'AI Search Readiness',
      pct: seoScore >= 70 ? 60 : seoScore >= 40 ? 35 : 12,
      weight: 5,
      color: seoScore >= 70 ? '#39FF14' : seoScore >= 40 ? '#FFB800' : '#FF3366'
    },
  ];
}

// ---- HELPER: Derive platform/feature details ----
function computeFeatures(lead: Lead) {
  const websiteExists = lead.website && lead.website !== 'N/A' && lead.website !== 'null';
  const hasAnalytics = websiteExists && (lead.seo_score || 0) >= 50;
  const hasLeadForms = false; // simulated — typically not available
  const hasLiveChat = false;
  const hasBooking = websiteExists && lead.review_count > 30;
  const hasTestimonials = websiteExists && lead.review_count > 20;
  const hasBlog = websiteExists && (lead.seo_score || 0) >= 65;
  const aiReady = (lead.seo_score || 0) >= 70;

  return {
    platform: lead.platform || (websiteExists ? 'Unknown CMS' : 'None'),
    speed: lead.site_speed || (websiteExists ? 'Unknown' : 'N/A'),
    ssl: lead.ssl_status || (websiteExists ? 'Unknown' : 'N/A'),
    seoScore: lead.seo_score || 0,
    analytics: hasAnalytics ? 'Google Analytics, GTM' : 'None',
    adPixels: hasAnalytics ? 'Partial' : 'None',
    googleAds: lead.gaps?.includes('ADS') ? 'None' : 'Google Ads',
    leadForms: hasLeadForms,
    liveChat: hasLiveChat,
    booking: hasBooking,
    testimonials: hasTestimonials,
    blog: hasBlog,
    aiReady: aiReady,
    aiReadyScore: aiReady ? 72 : (lead.seo_score || 0) > 40 ? 48 : 18
  };
}

// ---- HELPER: Generate vulnerabilities from lead data ----
function computeVulnerabilities(lead: Lead): { text: string; severity: 'critical' | 'warning' | 'info' }[] {
  const vulns: { text: string; severity: 'critical' | 'warning' | 'info' }[] = [];
  const websiteExists = lead.website && lead.website !== 'N/A' && lead.website !== 'null';

  if (!websiteExists) {
    vulns.push({ text: 'No website detected — losing all online traffic', severity: 'critical' });
  }
  if (lead.ssl_status && (lead.ssl_status.toLowerCase().includes('invalid') || lead.ssl_status.toLowerCase().includes('expired'))) {
    vulns.push({ text: 'SSL certificate invalid — browser security warnings', severity: 'critical' });
  }
  if ((lead.seo_score || 0) < 40) {
    vulns.push({ text: 'No blog — missing organic traffic engine', severity: 'critical' });
  }
  if (lead.gaps?.includes('SOCIAL')) {
    vulns.push({ text: 'No video content — lower engagement', severity: 'warning' });
  }
  if (!lead.gaps?.includes('ADS') === false || lead.gaps?.includes('ADS')) {
    vulns.push({ text: 'No lead capture form — leaking conversions', severity: 'critical' });
  }
  if (lead.gaps?.includes('EMAIL')) {
    vulns.push({ text: 'No live chat/WhatsApp — losing impatient leads', severity: 'warning' });
  }

  // Add from existing vulnerabilities
  if (lead.vulnerabilities && lead.vulnerabilities.length > 0) {
    lead.vulnerabilities.forEach(v => {
      if (!vulns.some(vv => vv.text.toLowerCase().includes(v.toLowerCase().substring(0, 20)))) {
        vulns.push({ text: v, severity: 'warning' });
      }
    });
  }

  return vulns.slice(0, 6);
}

// ---- HELPER: Parse decision maker & social media metadata from notes ----
interface ParsedNotes {
  decisionMaker: string;
  title: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  placeUrl: string;
  activeAds: string;
  extraNotes: string;
}

function parseLeadNotes(notesStr: string): ParsedNotes {
  const result: ParsedNotes = {
    decisionMaker: 'N/A',
    title: 'Owner / Founder',
    facebookUrl: 'N/A',
    instagramUrl: 'N/A',
    linkedinUrl: 'N/A',
    placeUrl: 'N/A',
    activeAds: 'N/A',
    extraNotes: '',
  };

  if (!notesStr) return result;

  // Check if it's the old enrichment format: "Enriched contact: Name (Title). LinkedIn: URL. Ads status: ..."
  if (notesStr.startsWith('Enriched contact:')) {
    const match = notesStr.match(/Enriched contact:\s*(.*?)\s*\((.*?)\)\.\s*LinkedIn:\s*(.*?)\.\s*Ads status:\s*(.*?)(\.|$)/i);
    if (match) {
      result.decisionMaker = match[1]?.trim() || 'N/A';
      result.title = match[2]?.trim() || 'Owner / Founder';
      result.linkedinUrl = match[3]?.trim() || 'N/A';
      result.activeAds = match[4]?.trim() || 'N/A';
      return result;
    }
  }

  // Parse line-by-line
  const lines = notesStr.split('\n');
  const remainingLines: string[] = [];

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('Decision Maker:')) {
      result.decisionMaker = cleanLine.replace('Decision Maker:', '').trim() || 'N/A';
    } else if (cleanLine.startsWith('Title:')) {
      result.title = cleanLine.replace('Title:', '').trim() || 'Owner / Founder';
    } else if (cleanLine.startsWith('Facebook:')) {
      result.facebookUrl = cleanLine.replace('Facebook:', '').trim() || 'N/A';
    } else if (cleanLine.startsWith('Instagram:')) {
      result.instagramUrl = cleanLine.replace('Instagram:', '').trim() || 'N/A';
    } else if (cleanLine.startsWith('LinkedIn:')) {
      result.linkedinUrl = cleanLine.replace('LinkedIn:', '').trim() || 'N/A';
    } else if (cleanLine.startsWith('Google Maps:')) {
      result.placeUrl = cleanLine.replace('Google Maps:', '').trim() || 'N/A';
    } else if (cleanLine.startsWith('Active Ads:')) {
      result.activeAds = cleanLine.replace('Active Ads:', '').trim() || 'N/A';
    } else {
      if (cleanLine) {
        remainingLines.push(cleanLine);
      }
    }
  });

  result.extraNotes = remainingLines.join('\n');
  return result;
}

// ---- TABS ----
type TabId = 'diagnostic' | 'reviews' | 'contacts' | 'posts' | 'pitch' | 'plan';

const TAB_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'diagnostic', label: 'Diagnostic', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'reviews', label: 'Reviews', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'contacts', label: 'Contacts', icon: <Phone className="w-3.5 h-3.5" /> },
  { id: 'posts', label: 'Social/Posts', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'pitch', label: 'AI Pitch', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'plan', label: 'Plan', icon: <Target className="w-3.5 h-3.5" /> },
];

// ==============================================================
// MAIN COMPONENT
// ==============================================================
export const LeadModal: React.FC<LeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveNotes,
  outreachLogs,
  onLogOutreach,
  updateLeadStatus,
  onEnrich,
  initialTab = 'diagnostic'
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  // Pitch state
  const [template, setTemplate] = useState<'seo' | 'redesign' | 'ads' | 'outbound'>('seo');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [deepScraping, setDeepScraping] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (lead) {
      const parsed = parseLeadNotes(lead.notes || '');
      setNotes(parsed.extraNotes || '');
      setActiveTab(initialTab);
      setBarsAnimated(false);
      // Trigger bar animation after mount
      const t = setTimeout(() => setBarsAnimated(true), 100);
      return () => clearTimeout(t);
    }
  }, [lead, initialTab]);

  // Pitch templates
  const templates = useMemo(() => {
    if (!lead) return { seo: { s: '', b: '' }, redesign: { s: '', b: '' }, ads: { s: '', b: '' }, outbound: { s: '', b: '' } };
    const parsedNotes = parseLeadNotes(lead.notes || '');
    const cleanNotes = parsedNotes.extraNotes || 'Weak meta markup';
    return {
      seo: {
        s: `Critical SEO Gaps Detected on ${lead.company_name}`,
        b: `Hi Team at ${lead.company_name},\n\nI was reviewing local businesses in ${lead.location} and ran a technical performance scan on your website.\n\nOur system detected some critical SEO gaps that are likely making you invisible to potential customers in the area:\n- SEO Score: ${lead.seo_score || 35}/100\n- Identified Vulnerabilities: ${cleanNotes}\n\nWith these errors, Google has difficulty crawling your pages. We specialize in fixing exactly these issues. Would you be open to a quick 5-minute call this Thursday to review our suggestions?\n\nBest regards,\n[Your Name]`
      },
      redesign: {
        s: `Proposal: Website Speed & SSL Upgrade for ${lead.company_name}`,
        b: `Hi Team,\n\nI came across ${lead.company_name} online and noticed a few features on your website that might be turning mobile visitors away:\n- Speed Index: ${lead.site_speed || 'Slow'}\n- CMS Platform: ${lead.platform || 'Wix/GoDaddy'}\n- SSL Security: ${lead.ssl_status || 'Invalid'}\n\nOur simulator predicts these performance gaps are costing you roughly $${(lead.est_revenue_loss || 1200).toLocaleString()}/month in lost customer opportunities.\n\nWe design lighting-fast, secure websites that convert. Can I send you a 2-minute video mockup of what a redesigned site would look like for ${lead.company_name}?\n\nSincerely,\n[Your Name]`
      },
      ads: {
        s: `Unlocking New Traffic for ${lead.company_name}`,
        b: `Hello,\n\nI noticed that ${lead.company_name} has a strong reputation in ${lead.location} with ${lead.review_count || 0} positive reviews. However, our ad trackers show you don't have active retargeting pixels installed.\n\nThis means you're paying to drive traffic to your site, but letting 98% of those prospects leave without showing them follow-up ads on Google or Facebook.\n\nWe build custom high-ROI ad campaigns tailored for ${lead.niche}. Let me know if you have time for a brief chat to see how we can set this up for you.\n\nRegards,\n[Your Name]`
      },
      outbound: {
        s: `Growth Partnership Proposal: Qualified Meetings for ${lead.company_name}`,
        b: `Hi Team at ${lead.company_name},\n\nI came across your business online. I noticed you offer premium ${lead.niche} services, but you might be relying solely on word-of-mouth or referral traffic to grow your client list.\n\nWe specialize in setting up automated B2B outbound engines (cold email + LinkedIn sequences) to book 10-15 qualified sales meetings per month for agencies in your space.\n\nWe noticed a few gaps in your website's marketing stack that indicate you aren't currently running outbound campaigns. Would you be open to a brief 5-minute chat to see how we can book qualified calls for your sales reps on a pay-per-meeting basis?\n\nBest regards,\n[Your Name]`
      }
    };
  }, [lead]);

  useEffect(() => {
    if (lead) {
      setSubject(templates[template].s);
      setBody(templates[template].b);
    }
  }, [template, lead, templates]);

  if (!lead || !isOpen) return null;

  const scoring = computeScoringBreakdown(lead);
  const features = computeFeatures(lead);
  const vulns = computeVulnerabilities(lead);
  const filteredLogs = outreachLogs.filter(log => log.lead_id === lead.id);

  const tempLabel = lead.opportunity_temp === 'hot' ? 'HOT' : lead.opportunity_temp === 'warm' ? 'WARM' : 'COLD';
  const tempColor = lead.opportunity_temp === 'hot' ? '#FF3366' : lead.opportunity_temp === 'warm' ? '#FFB800' : '#00D4FF';

  const bestService = lead.service_pitched || (lead.gaps?.includes('WEB') ? 'Web Design' : lead.gaps?.includes('SEO') ? 'SEO' : lead.gaps?.includes('ADS') ? 'Google Ads' : 'Full Marketing');
  const estLeadsLost = Math.max(3, Math.round((lead.est_revenue_loss || 800) / 400));
  const dealMin = lead.deal_value_min || Math.round((lead.est_revenue_loss || 800) * 3);
  const dealMax = lead.deal_value_max || Math.round((lead.est_revenue_loss || 800) * 6);

  // -- Handlers --
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const parsed = parseLeadNotes(lead.notes || '');
      const metadata = [
        `Decision Maker: ${parsed.decisionMaker}`,
        `Title: ${parsed.title}`,
        `Facebook: ${parsed.facebookUrl}`,
        `Instagram: ${parsed.instagramUrl}`,
        `LinkedIn: ${parsed.linkedinUrl}`,
        `Google Maps: ${parsed.placeUrl}`,
        `Active Ads: ${parsed.activeAds}`
      ].join('\n');
      
      const fullNotes = notes ? `${metadata}\n${notes}` : metadata;
      await onSaveNotes(lead.id, fullNotes);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEnrich = async () => {
    if (!onEnrich || !lead) return;
    setEnriching(true);
    try {
      await onEnrich(lead.id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEnriching(false);
    }
  };

  const handleDeepScrape = async () => {
    if (!lead) return;
    const parsed = parseLeadNotes(lead.notes || '');
    if (!parsed.linkedinUrl || parsed.linkedinUrl === 'N/A') {
      showToast('No LinkedIn URL found to scrape', 'error');
      return;
    }
    setDeepScraping(true);
    showToast('Deep scraping LinkedIn profile...', 'success');
    try {
      const res = await fetch('/api/scrape/linkedin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsed.linkedinUrl })
      });
      if (!res.ok) throw new Error('Deep scrape failed');
      const data = await res.json();
      showToast('Profile scraped successfully!', 'success');
      // Ideally we update the lead here, but for now just show success
      // as the data would be fed to the AI or updated in Supabase.
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeepScraping(false);
    }
  };

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
      await onLogOutreach(lead.id, 'email', fullText, 'no_reply');
      await updateLeadStatus(lead.id, 'contacted');
      showToast("Email pitch logged as sent", "success");
      onClose();
    } catch (err: any) {
      showToast("Failed to log email: " + err.message, "error");
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async () => {
    if (!lead) return;
    setGeneratingPitch(true);
    setSubject("Generating subject...");
    setBody("Claude AI is analyzing the lead and writing a hyper-personalized pitch...");
    
    try {
      const parsedNotes = parseLeadNotes(lead.notes || '');
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: lead.company_name,
          website: lead.website,
          email: lead.email,
          niche: lead.niche,
          location: lead.location,
          rating: lead.rating,
          review_count: lead.review_count,
          ai_score: lead.ai_score,
          seo_score: lead.seo_score,
          gaps: lead.gaps || [],
          platform: lead.platform,
          site_speed: lead.site_speed,
          ssl_status: lead.ssl_status,
          est_revenue_loss: lead.est_revenue_loss,
          vulnerabilities: lead.vulnerabilities || [],
          decision_maker: parsedNotes.decisionMaker,
          angle: template,
          tone: 'professional',
          recent_posts: posts
        })
      });

      if (!res.ok) throw new Error("API request failed");

      if (res.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader");
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'complete' && parsed.result) {
                  setSubject(parsed.result.subject || '');
                  setBody(parsed.result.body || '');
                  showToast("AI Pitch Generated Successfully", "success");
                }
              } catch (e) {}
            }
          }
        }
      } else {
        const data = await res.json();
        if (data.subject && data.body) {
          setSubject(data.subject);
          setBody(data.body);
          showToast("AI Pitch Generated", "success");
        }
      }
    } catch (err: any) {
      showToast("Failed to generate AI pitch", "error");
      setSubject(templates[template].s);
      setBody(templates[template].b);
    } finally {
      setGeneratingPitch(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#080C18]/85 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#080C18]/95 border-2 border-[#00D4FF]/25 rounded-xl w-full max-w-[1050px] h-[88vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,212,255,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== MODAL HEADER ===== */}
        <div className="px-6 py-4 border-b border-[#00D4FF]/12 flex items-center justify-between bg-[#080C18]/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#0A0E1A] rounded-lg flex items-center justify-center border border-[#00D4FF]/25 shadow-[0_0_12px_rgba(0,212,255,0.15)]">
              <Zap className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-white font-['Syne'] tracking-wide leading-tight">
                {lead.company_name}
              </h3>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-2 uppercase tracking-wider">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#00D4FF]" />{lead.location}</span>
                <span className="text-neutral-700">·</span>
                <span>{lead.niche}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-neutral-900 border border-[#00D4FF]/20 hover:border-[#FF3366]/50 rounded-full flex items-center justify-center text-neutral-400 hover:text-[#FF3366] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===== TABS ===== */}
        <div className="diag-tabs shrink-0">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.id}
              className={`diag-tab font-mono ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ===== TAB CONTENT ===== */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'diagnostic' && <DiagnosticTab lead={lead} scoring={scoring} features={features} vulns={vulns} tempLabel={tempLabel} tempColor={tempColor} bestService={bestService} estLeadsLost={estLeadsLost} dealMin={dealMin} dealMax={dealMax} barsAnimated={barsAnimated} />}
          {activeTab === 'reviews' && <ReviewsTab lead={lead} />}
          {activeTab === 'contacts' && <ContactsTab lead={lead} onEnrich={handleEnrich} enriching={enriching} onDeepScrape={handleDeepScrape} deepScraping={deepScraping} />}
          {activeTab === 'posts' && <PostsTab lead={lead} posts={posts} setPosts={setPosts} />}
          {activeTab === 'pitch' && <PitchTab lead={lead} template={template} setTemplate={setTemplate} subject={subject} setSubject={setSubject} body={body} setBody={setBody} copied={copied} handleCopy={handleCopy} />}
          {activeTab === 'plan' && <PlanTab lead={lead} notes={notes} setNotes={setNotes} handleSaveNotes={handleSaveNotes} savingNotes={savingNotes} filteredLogs={filteredLogs} />}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="px-6 py-3.5 border-t border-[#00D4FF]/12 flex items-center justify-between bg-[#080C18]/85 shrink-0 select-none">
          <button
            onClick={onClose}
            className="text-[10px] font-mono font-bold text-neutral-500 hover:text-white uppercase tracking-wider cursor-pointer transition-colors px-3 py-1.5"
          >
            Dismiss
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={handleRegenerate}
              disabled={generatingPitch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#00D4FF]/25 rounded-md text-[10px] font-mono font-bold text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/50 transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generatingPitch ? 'animate-pulse' : ''}`} /> 
              {generatingPitch ? 'Generating...' : 'Regenerate Sequence'}
            </button>
            <button
              onClick={handleSendLog}
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] rounded-md text-[10px] font-mono font-bold text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              <Rocket className="w-3.5 h-3.5" /> Initiate Outreach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// TAB 1: DIAGNOSTIC
// ==============================================================
function DiagnosticTab({ lead, scoring, features, vulns, tempLabel, tempColor, bestService, estLeadsLost, dealMin, dealMax, barsAnimated }: {
  lead: Lead;
  scoring: ReturnType<typeof computeScoringBreakdown>;
  features: ReturnType<typeof computeFeatures>;
  vulns: ReturnType<typeof computeVulnerabilities>;
  tempLabel: string;
  tempColor: string;
  bestService: string;
  estLeadsLost: number;
  dealMin: number;
  dealMax: number;
  barsAnimated: boolean;
}) {
  const scoreColor = lead.ai_score >= 70 ? '#39FF14' : lead.ai_score >= 40 ? '#FFB800' : '#FF3366';

  return (
    <div className="p-6 space-y-5 font-mono text-[11px]">
      {/* --- TOP STATS ROW --- */}
      <div className="grid grid-cols-3 gap-3">
        {/* Opportunity Score */}
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Opportunity Score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white font-['Syne']" style={{ textShadow: `0 0 12px ${scoreColor}55` }}>
              {lead.ai_score}
            </span>
            <span className="text-neutral-500 text-sm font-bold">/99</span>
          </div>
          <div className="mt-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest" style={{ background: `${tempColor}15`, color: tempColor, border: `1px solid ${tempColor}30` }}>
              {tempLabel}
            </span>
          </div>
        </div>

        {/* Est. Revenue Loss */}
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Est. Revenue Loss</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-[#FF3366] font-['Syne']">${(lead.est_revenue_loss || 800).toLocaleString()}</span>
            <span className="text-neutral-500 text-xs font-bold">/mo</span>
          </div>
          <div className="text-[9px] text-neutral-500 mt-1">~{estLeadsLost} leads lost monthly</div>
        </div>

        {/* Deal Value */}
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Deal Value</div>
          <div className="text-lg font-extrabold text-[#39FF14] font-['Syne']">
            ${dealMin.toLocaleString()} - ${dealMax.toLocaleString()}<span className="text-xs text-neutral-500">/yr</span>
          </div>
          <div className="text-[9px] text-neutral-500 mt-1">Best pitch: <span className="text-[#00D4FF] font-bold">{bestService}</span></div>
        </div>
      </div>

      {/* --- WEIGHTED SCORING BREAKDOWN --- */}
      <div className="space-y-1.5">
        <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-extrabold mb-2">Weighted Scoring Breakdown</div>
        {scoring.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-[10px] text-neutral-400 w-[140px] text-right shrink-0 font-semibold">{item.label}</span>
            <div className="scoring-bar-track flex-1">
              <div
                className="scoring-bar-fill"
                style={{
                  width: barsAnimated ? `${item.pct}%` : '0%',
                  background: `linear-gradient(90deg, ${item.color}CC, ${item.color}88)`,
                  boxShadow: `0 0 6px ${item.color}44`
                }}
              />
            </div>
            <span className="text-[10px] font-extrabold w-[35px] text-right" style={{ color: item.color }}>{item.pct}%</span>
            <span className="text-[8px] text-neutral-600 w-[24px] text-right">×{item.weight}</span>
          </div>
        ))}
      </div>

      {/* --- PLATFORM QUICK STATS --- */}
      <div className="grid grid-cols-4 gap-[1px] bg-[#00D4FF]/6 border border-[#00D4FF]/8 rounded-md overflow-hidden">
        {[
          { label: 'Platform', value: features.platform, className: 'text-white font-extrabold' },
          { label: 'Speed', value: features.speed, className: features.speed?.toLowerCase().includes('fast') ? 'text-[#39FF14] font-extrabold' : 'text-[#FFB800] font-extrabold' },
          { label: 'SSL', value: features.ssl?.toLowerCase().includes('valid') ? 'Secure' : features.ssl?.toLowerCase().includes('invalid') ? 'Invalid' : features.ssl || 'N/A', className: features.ssl?.toLowerCase().includes('valid') ? 'text-[#39FF14] font-extrabold' : 'text-[#FF3366] font-extrabold' },
          { label: 'SEO', value: `${features.seoScore}/100`, className: features.seoScore >= 70 ? 'text-[#39FF14] font-extrabold' : features.seoScore >= 40 ? 'text-[#FFB800] font-extrabold' : 'text-[#FF3366] font-extrabold' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#080C18]/85 p-3 text-center">
            <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">{stat.label}</div>
            <div className={`text-[12px] mt-1 ${stat.className}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* --- FEATURE CHECKLIST --- */}
      <div className="feature-grid">
        <FeatureRow label="Analytics" value={features.analytics !== 'None' ? `✅ ${features.analytics}` : '❌ None'} status={features.analytics !== 'None' ? 'active' : 'missing'} />
        <FeatureRow label="Ad Pixels" value={features.adPixels !== 'None' ? `⚠️ ${features.adPixels}` : '❌ None'} status={features.adPixels !== 'None' ? 'partial' : 'missing'} />
        <FeatureRow label="Lead Forms" value={features.leadForms ? '✅ Active' : '❌ Missing'} status={features.leadForms ? 'active' : 'missing'} />
        <FeatureRow label="Live Chat" value={features.liveChat ? '✅ Active' : '❌ None'} status={features.liveChat ? 'active' : 'missing'} />
        <FeatureRow label="Booking" value={features.booking ? '✅ Active' : '❌ None'} status={features.booking ? 'active' : 'missing'} />
        <FeatureRow label="Testimonials" value={features.testimonials ? '✅ Found' : '❌ None'} status={features.testimonials ? 'active' : 'missing'} />
        <FeatureRow label="Blog" value={features.blog ? '✅ Active' : '⊘ None'} status={features.blog ? 'active' : 'none'} />
        <FeatureRow label="AI Ready (AEO)" value={`${features.aiReadyScore}/100`} status={features.aiReady ? 'active' : 'partial'} showDot />
      </div>

      {/* --- REVENUE LEAKAGE ANALYSIS --- */}
      <div className="diag-stat-card border-[#FF3366]/30 bg-[#FF3366]/5 mt-4">
        <div className="text-[10px] text-[#FF3366] uppercase tracking-widest font-extrabold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Revenue Leakage Analysis
        </div>
        <div className="space-y-3">
          {/* 1. Load Speed */}
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${features.speed?.includes('Slow') ? 'bg-[#FF3366]' : 'bg-[#39FF14]'}`} />
            <div>
              <div className="text-white font-bold text-[10px]">1. Website Loading Speed: {features.speed}</div>
              <div className="text-neutral-400 text-[9px] mt-0.5 leading-relaxed">
                {features.speed?.includes('Slow') 
                  ? "A 1-second delay in load time drops conversions ~7%. This site loads slowly. If they get 1,000 visitors a month, that's hundreds of lost leads and thousands in lost revenue." 
                  : "Good load time. No major conversion leakage here."}
              </div>
            </div>
          </div>
          
          {/* 2. Website Existence */}
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${lead.website && lead.website !== 'N/A' && lead.website !== 'null' ? 'bg-[#39FF14]' : 'bg-[#FF3366]'}`} />
            <div>
              <div className="text-white font-bold text-[10px]">2. Digital Presence: {lead.website && lead.website !== 'N/A' && lead.website !== 'null' ? 'Website Found' : 'No Website'}</div>
              <div className="text-neutral-400 text-[9px] mt-0.5 leading-relaxed">
                {lead.website && lead.website !== 'N/A' && lead.website !== 'null'
                  ? "They have an active website to capture traffic."
                  : "Critical failure: No website detected. They are losing 100% of online search traffic to competitors."}
              </div>
            </div>
          </div>

          {/* 3. SEO */}
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${features.seoScore >= 70 ? 'bg-[#39FF14]' : 'bg-[#FF3366]'}`} />
            <div>
              <div className="text-white font-bold text-[10px]">3. SEO Configuration: {features.seoScore}/100 Score</div>
              <div className="text-neutral-400 text-[9px] mt-0.5 leading-relaxed">
                {features.seoScore >= 70
                  ? "Properly optimized for search engines."
                  : "Missing basic SEO tags. Google cannot rank this site, meaning zero organic inbound leads. Huge revenue leak."}
              </div>
            </div>
          </div>

          {/* 4. Mobile Web */}
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${lead.gaps?.includes('WEB') ? 'bg-[#FF3366]' : 'bg-[#39FF14]'}`} />
            <div>
              <div className="text-white font-bold text-[10px]">4. Mobile Responsiveness: {lead.gaps?.includes('WEB') ? 'Issues Detected' : 'Optimized'}</div>
              <div className="text-neutral-400 text-[9px] mt-0.5 leading-relaxed">
                {lead.gaps?.includes('WEB')
                  ? "Mobile issues flag detected. 60% of local searches are mobile; a bad mobile site immediately kills conversions."
                  : "Site appears modern and likely responsive."}
              </div>
            </div>
          </div>

          {/* 5. Contact Friction */}
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${(lead.phone && lead.phone !== 'N/A' && lead.phone !== 'null') || (lead.email && lead.email !== 'N/A' && lead.email !== 'null') ? 'bg-[#39FF14]' : 'bg-[#FF3366]'}`} />
            <div>
              <div className="text-white font-bold text-[10px]">5. Contact Friction: {(lead.phone && lead.phone !== 'N/A' && lead.phone !== 'null') || (lead.email && lead.email !== 'N/A' && lead.email !== 'null') ? 'Contact Info Found' : 'Hard to Contact'}</div>
              <div className="text-neutral-400 text-[9px] mt-0.5 leading-relaxed">
                {(lead.phone && lead.phone !== 'N/A' && lead.phone !== 'null') || (lead.email && lead.email !== 'N/A' && lead.email !== 'null')
                  ? "Phone/Email is accessible, minimizing friction for leads."
                  : "No phone or email readily found on the site. If a prospect has to search for 30+ seconds to find contact info, they will bounce to a competitor."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- VULNERABILITIES --- */}
      {vulns.length > 0 && (
        <div className="space-y-2">
          <div className="text-[8px] text-[#FF3366] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Vulnerabilities
          </div>
          <div className="flex flex-wrap gap-2">
            {vulns.map((v, i) => (
              <div key={i} className={`vuln-chip ${v.severity}`}>
                {v.severity === 'critical' ? '▲' : v.severity === 'warning' ? '△' : 'ℹ'} {v.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- AI STRATEGIC ANALYSIS --- */}
      <div className="ai-summary-box">
        <div className="flex items-start gap-3 pl-3">
          <Cpu className="w-5 h-5 text-[#00D4FF] shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-1.5 font-['Syne']">AI Strategic Analysis</div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {lead.company_name} | {lead.niche} | {lead.location} uses {features.platform}. 
              Estimated <span className="text-[#FF3366] font-extrabold">${(lead.est_revenue_loss || 800).toLocaleString()}/mo</span> revenue leakage from {estLeadsLost} lost leads.
              {' '}Best service to pitch: <span className="text-[#00D4FF] font-extrabold">{bestService}</span>.
              {' '}Classification: <span className="font-extrabold" style={{ color: tempColor }}>{tempLabel}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ label, value, status, showDot }: { label: string; value: string; status: string; showDot?: boolean }) {
  const statusClass = status === 'active' ? 'active' : status === 'missing' ? 'missing' : status === 'partial' ? 'partial' : 'none';
  return (
    <div className="feature-row">
      <span className="feature-label">{label}</span>
      <span className={`feature-val ${statusClass}`}>
        {showDot && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'active' ? 'bg-[#39FF14]' : 'bg-[#FFB800]'}`} />}
        {value}
      </span>
    </div>
  );
}

// ==============================================================
// TAB 2: REVIEWS
// ==============================================================
function ReviewsTab({ lead }: { lead: Lead }) {
  const ratingColor = (lead.rating || 0) >= 4.0 ? '#39FF14' : (lead.rating || 0) >= 3.0 ? '#FFB800' : '#FF3366';

  return (
    <div className="p-6 space-y-5 font-mono text-[11px]">
      {/* Rating overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="diag-stat-card text-center">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Google Rating</div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-6 h-6" style={{ color: ratingColor, fill: `${ratingColor}30` }} />
            <span className="text-4xl font-extrabold font-['Syne']" style={{ color: ratingColor }}>{lead.rating || 'N/A'}</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-2">{lead.review_count || 0} total reviews</div>
        </div>

        <div className="diag-stat-card space-y-3">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Review Health</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-semibold">Response Rate</span>
              <span className="text-[#FF3366] font-extrabold">None detected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-semibold">Avg. Sentiment</span>
              <span className={`font-extrabold`} style={{ color: ratingColor }}>
                {(lead.rating || 0) >= 4.0 ? 'Positive' : (lead.rating || 0) >= 3.0 ? 'Mixed' : 'Negative'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-semibold">Review Velocity</span>
              <span className="text-neutral-400 font-extrabold">{Math.round((lead.review_count || 0) / 12)}/month avg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-semibold">Competitor Avg</span>
              <span className="text-[#FFB800] font-extrabold">4.2★ (65 reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Star breakdown */}
      <div className="diag-stat-card">
        <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Star Distribution (estimated)</div>
        {[5, 4, 3, 2, 1].map(star => {
          const total = lead.review_count || 10;
          const pct = star === 5 ? 55 : star === 4 ? 22 : star === 3 ? 12 : star === 2 ? 6 : 5;
          const count = Math.round(total * pct / 100);
          return (
            <div key={star} className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] text-neutral-400 w-8">{star}★</span>
              <div className="flex-1 h-2 bg-[#0A0E1A] rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${pct}%`, background: star >= 4 ? '#39FF14' : star === 3 ? '#FFB800' : '#FF3366' }} />
              </div>
              <span className="text-[10px] text-neutral-500 w-8">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="ai-summary-box">
        <div className="flex items-start gap-3 pl-3">
          <MessageSquare className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-extrabold text-white uppercase tracking-wider mb-1 font-['Syne']">Review Strategy</div>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              {(lead.rating || 0) < 4.0
                ? `With a ${lead.rating || 0}★ rating, this business falls below the 4.0 trust threshold. Active review management and responding to negatives can lift the rating within 60-90 days. This is a strong pitch angle.`
                : `Strong ${lead.rating || 0}★ rating, but review response is missing. Offering review management automation could still be a valuable add-on service.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// TAB 3: CONTACTS
// ==============================================================
interface ContactsTabProps {
  lead: Lead;
  onEnrich?: () => Promise<void>;
  enriching: boolean;
  onDeepScrape?: () => Promise<void>;
  deepScraping?: boolean;
}

function ContactsTab({ lead, onEnrich, enriching, onDeepScrape, deepScraping }: ContactsTabProps) {
  const parsed = parseLeadNotes(lead.notes || '');

  const contactFields = [
    { icon: <Globe className="w-4 h-4 text-[#00D4FF]" />, label: 'Website URL', value: lead.website, link: lead.website && lead.website !== 'N/A' && lead.website !== 'null' ? lead.website : null },
    { icon: <Mail className="w-4 h-4 text-[#00D4FF]" />, label: 'Contact Email', value: lead.email, link: lead.email && lead.email !== 'N/A' ? `mailto:${lead.email}` : null },
    { icon: <Phone className="w-4 h-4 text-[#00D4FF]" />, label: 'Direct Phone', value: lead.phone, link: lead.phone && lead.phone !== 'N/A' ? `tel:${lead.phone}` : null },
    { icon: <MapPin className="w-4 h-4 text-[#00D4FF]" />, label: 'Location', value: lead.location, link: null },
    { icon: <Target className="w-4 h-4 text-[#00D4FF]" />, label: 'Business Category', value: lead.niche, link: null },
    { icon: <Calendar className="w-4 h-4 text-[#00D4FF]" />, label: 'Added to CRM', value: new Date(lead.created_at).toLocaleDateString(), link: null },
    { icon: <Activity className="w-4 h-4 text-[#39FF14]" />, label: 'Last Contacted', value: lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : 'Never', link: null },
    { icon: <FileText className="w-4 h-4 text-[#00D4FF]" />, label: 'Source Query', value: lead.source_query || 'Direct Scrape', link: null },
  ];

  const hasDm = parsed.decisionMaker && parsed.decisionMaker !== 'N/A';
  const hasLinkedin = parsed.linkedinUrl && parsed.linkedinUrl !== 'N/A';
  const hasFacebook = parsed.facebookUrl && parsed.facebookUrl !== 'N/A';
  const hasInstagram = parsed.instagramUrl && parsed.instagramUrl !== 'N/A';
  const hasPlace = parsed.placeUrl && parsed.placeUrl !== 'N/A';

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-[11px]">
      {/* LEFT COLUMN: CORE CONTACT DETAILS */}
      <div className="space-y-4">
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-4">Contact Information</div>
          <div className="space-y-3">
            {contactFields.map((cf, i) => (
              <div key={i} className="flex items-center gap-3 pb-2.5 border-b border-[#00D4FF]/5 last:border-b-0">
                {cf.icon}
                <span className="text-neutral-500 font-semibold w-[130px] shrink-0 uppercase text-[9px] tracking-wider">{cf.label}</span>
                {cf.link ? (
                  <a href={cf.link} target="_blank" rel="noreferrer" className="text-white hover:text-[#00D4FF] font-bold flex items-center gap-1.5 truncate transition-colors">
                    {(cf.value || 'N/A').replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 text-neutral-600" />
                  </a>
                ) : (
                  <span className={`font-bold ${cf.value && cf.value !== 'N/A' && cf.value !== 'Never' ? 'text-white' : 'text-neutral-600'}`}>
                    {cf.value || 'N/A'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CRM Status */}
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3">CRM Pipeline Status</div>
          <div className="flex items-center gap-3">
            <span className={`text-[9px] px-2.5 py-1 rounded font-extrabold uppercase tracking-widest ${
              lead.crm_status === 'closed_won' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30'
              : lead.crm_status === 'closed_lost' ? 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30'
              : lead.crm_status === 'contacted' ? 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30'
              : 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30'
            }`}>
              {lead.crm_status.replace('_', ' ')}
            </span>
            <span className="text-neutral-500 text-[9px]">
              Last updated: {new Date(lead.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: DECISION MAKER & SOCIAL GRIDS */}
      <div className="space-y-4">
        {/* Decision Maker Card */}
        <div className="diag-stat-card flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Key Decision Maker</div>
            {hasDm ? (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-[13px]">{parsed.decisionMaker}</div>
                  <div className="text-[#00D4FF] text-[9.5px] font-bold mt-0.5">{parsed.title}</div>
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 italic text-[10px] py-1">
                No verified decision maker identified.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#00D4FF]/5 flex items-center justify-between gap-3">
            {hasLinkedin ? (
              <a 
                href={parsed.linkedinUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/35 text-[#0A66C2] rounded text-[9px] font-bold uppercase transition-all"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
              </a>
            ) : (
              <span className="text-neutral-600 text-[9px]">No LinkedIn Profile linked</span>
            )}

            <div className="flex items-center gap-2">
              {hasLinkedin && onDeepScrape && (
                <button
                  onClick={onDeepScrape}
                  disabled={deepScraping}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#0A66C2] disabled:opacity-50 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 font-mono"
                >
                  {deepScraping ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Scraping Profile...</>
                  ) : (
                    <><Linkedin className="w-3 h-3" /> Deep Scrape</>
                  )}
                </button>
              )}
              {onEnrich && (
                <button
                  onClick={onEnrich}
                  disabled={enriching}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] text-white disabled:opacity-50 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 font-mono"
                >
                  {enriching ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" /> Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" /> {hasDm ? 'Re-Enrich Contact' : 'Enrich Contact'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Social Grid */}
        <div className="diag-stat-card">
          <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Linked Accounts & Socials</div>
          <div className="grid grid-cols-2 gap-3">
            {/* LinkedIn Account */}
            {hasLinkedin ? (
              <a 
                href={parsed.linkedinUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex flex-col p-3 rounded bg-[#0A66C2]/10 border border-[#0A66C2]/20 hover:border-[#0A66C2]/50 hover:shadow-[0_0_10px_rgba(10,102,194,0.15)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 bg-[#0A66C2]/20 text-[#0A66C2] rounded">ACTIVE</span>
                </div>
                <div className="text-white font-bold text-[10px]">LinkedIn</div>
                <div className="text-neutral-500 text-[8px] mt-0.5 truncate">{parsed.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>
              </a>
            ) : (
              <div className="flex flex-col p-3 rounded bg-neutral-950/40 border border-neutral-900 opacity-40">
                <div className="flex items-center justify-between mb-2">
                  <Linkedin className="w-4 h-4 text-neutral-500" />
                  <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.5 bg-neutral-900 text-neutral-500 rounded">MISSING</span>
                </div>
                <div className="text-neutral-400 font-bold text-[10px]">LinkedIn</div>
                <div className="text-neutral-600 text-[8px] mt-0.5">Not Available</div>
              </div>
            )}

            {/* Facebook Account */}
            {hasFacebook ? (
              <a 
                href={parsed.facebookUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex flex-col p-3 rounded bg-[#1877F2]/10 border border-[#1877F2]/20 hover:border-[#1877F2]/50 hover:shadow-[0_0_10px_rgba(24,119,242,0.15)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 bg-[#1877F2]/20 text-[#1877F2] rounded">ACTIVE</span>
                </div>
                <div className="text-white font-bold text-[10px]">Facebook</div>
                <div className="text-neutral-500 text-[8px] mt-0.5 truncate">{parsed.facebookUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>
              </a>
            ) : (
              <div className="flex flex-col p-3 rounded bg-neutral-950/40 border border-neutral-900 opacity-40">
                <div className="flex items-center justify-between mb-2">
                  <Facebook className="w-4 h-4 text-neutral-500" />
                  <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.5 bg-neutral-900 text-neutral-500 rounded">MISSING</span>
                </div>
                <div className="text-neutral-400 font-bold text-[10px]">Facebook</div>
                <div className="text-neutral-600 text-[8px] mt-0.5">Not Available</div>
              </div>
            )}

            {/* Instagram Account */}
            {hasInstagram ? (
              <a 
                href={parsed.instagramUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex flex-col p-3 rounded bg-[#E1306C]/10 border border-[#E1306C]/20 hover:border-[#E1306C]/50 hover:shadow-[0_0_10px_rgba(225,48,108,0.15)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Instagram className="w-4 h-4 text-[#E1306C]" />
                  <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 bg-[#E1306C]/20 text-[#E1306C] rounded">ACTIVE</span>
                </div>
                <div className="text-white font-bold text-[10px]">Instagram</div>
                <div className="text-neutral-500 text-[8px] mt-0.5 truncate">{parsed.instagramUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>
              </a>
            ) : (
              <div className="flex flex-col p-3 rounded bg-neutral-950/40 border border-neutral-900 opacity-40">
                <div className="flex items-center justify-between mb-2">
                  <Instagram className="w-4 h-4 text-neutral-500" />
                  <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.5 bg-neutral-900 text-neutral-500 rounded">MISSING</span>
                </div>
                <div className="text-neutral-400 font-bold text-[10px]">Instagram</div>
                <div className="text-neutral-600 text-[8px] mt-0.5">Not Available</div>
              </div>
            )}

            {/* Google Maps Account */}
            {hasPlace ? (
              <a 
                href={parsed.placeUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex flex-col p-3 rounded bg-[#4285F4]/10 border border-[#4285F4]/20 hover:border-[#4285F4]/50 hover:shadow-[0_0_10px_rgba(66,133,244,0.15)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-4 h-4 text-[#EA4335]" />
                  <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 bg-[#34A853]/20 text-[#34A853] rounded">ACTIVE</span>
                </div>
                <div className="text-white font-bold text-[10px]">Google Maps</div>
                <div className="text-neutral-500 text-[8px] mt-0.5 truncate">{parsed.placeUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>
              </a>
            ) : (
              <div className="flex flex-col p-3 rounded bg-neutral-950/40 border border-neutral-900 opacity-40">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.5 bg-neutral-900 text-neutral-500 rounded">MISSING</span>
                </div>
                <div className="text-neutral-400 font-bold text-[10px]">Google Maps</div>
                <div className="text-neutral-600 text-[8px] mt-0.5">Not Available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// TAB 4: AI PITCH
// ==============================================================
function PitchTab({ lead, template, setTemplate, subject, setSubject, body, setBody, copied, handleCopy }: {
  lead: Lead;
  template: 'seo' | 'redesign' | 'ads' | 'outbound';
  setTemplate: (t: 'seo' | 'redesign' | 'ads' | 'outbound') => void;
  subject: string;
  setSubject: (s: string) => void;
  body: string;
  setBody: (b: string) => void;
  copied: boolean;
  handleCopy: () => void;
}) {
  return (
    <div className="p-6 space-y-4 font-mono text-[11px] select-none">
      {/* Template Selector Tabs */}
      <div className="space-y-1.5">
        <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">Select AI Angle Template</label>
        <div className="grid grid-cols-4 gap-2">
          {(['seo', 'redesign', 'ads', 'outbound'] as const).map((t) => {
            const active = template === t;
            const labels = { seo: 'SEO Audit', redesign: 'Redesign Web', ads: 'Traffic Ads', outbound: 'Outbound SDR' };
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t)}
                className={`py-2 border rounded font-bold cursor-pointer transition-all duration-300 text-center text-[9px] ${
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
        <label className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest block">Email Body Text</label>
        <textarea
          className="bg-black/60 border border-[#00D4FF]/25 w-full h-[220px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none resize-none select-text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {/* Copy button */}
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="bg-neutral-900 border border-neutral-800 hover:border-[#00D4FF]/50 text-neutral-400 hover:text-white px-3.5 py-2 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Pitch'}
        </button>
      </div>
    </div>
  );
}

// ==============================================================
// TAB 5: PLAN
// ==============================================================
function PlanTab({ lead, notes, setNotes, handleSaveNotes, savingNotes, filteredLogs }: {
  lead: Lead;
  notes: string;
  setNotes: (n: string) => void;
  handleSaveNotes: () => void;
  savingNotes: boolean;
  filteredLogs: any[];
}) {
  const actionPlan = useMemo(() => {
    const steps: { step: number; action: string; priority: 'high' | 'medium'; timeline: string }[] = [];
    let n = 1;

    if (lead.gaps?.includes('WEB')) {
      steps.push({ step: n++, action: `Build professional website for ${lead.company_name} with lead capture forms`, priority: 'high', timeline: 'Week 1-2' });
    }
    if ((lead.seo_score || 0) < 50) {
      steps.push({ step: n++, action: 'Technical SEO audit & fix meta tags, alt texts, schema markup', priority: 'high', timeline: 'Week 2-3' });
    }
    if (lead.gaps?.includes('SOCIAL')) {
      steps.push({ step: n++, action: 'Set up Instagram & Facebook business pages with branded content', priority: 'medium', timeline: 'Week 3-4' });
    }
    if (lead.gaps?.includes('ADS')) {
      steps.push({ step: n++, action: 'Launch targeted Google Ads campaign for local keywords', priority: 'high', timeline: 'Week 2-4' });
    }
    if (lead.gaps?.includes('EMAIL')) {
      steps.push({ step: n++, action: 'Implement email nurture sequence & automated follow-ups', priority: 'medium', timeline: 'Week 4-6' });
    }
    steps.push({ step: n++, action: 'Schedule quarterly review call to measure ROI & adjust strategy', priority: 'medium', timeline: 'Month 3' });

    return steps;
  }, [lead]);

  return (
    <div className="p-6 space-y-5 font-mono text-[11px]">
      {/* Outreach Action Plan */}
      <div className="diag-stat-card">
        <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#00D4FF]" /> Suggested Outreach Action Plan
        </div>
        <div className="space-y-2">
          {actionPlan.map((item) => (
            <div key={item.step} className="flex items-start gap-3 p-2.5 bg-black/30 border border-[#00D4FF]/8 rounded-md">
              <span className="w-6 h-6 bg-[#00D4FF]/10 border border-[#00D4FF]/25 rounded flex items-center justify-center text-[#00D4FF] font-extrabold text-[9px] shrink-0">
                {item.step}
              </span>
              <div className="flex-1">
                <div className="text-white font-bold text-[10.5px] leading-snug">{item.action}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    item.priority === 'high' ? 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20' : 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20'
                  }`}>
                    {item.priority} priority
                  </span>
                  <span className="text-[8px] text-neutral-500">{item.timeline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outreach Log */}
      <div className="diag-stat-card">
        <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#39FF14]" /> Communication Log
        </div>
        <div className="max-h-[140px] overflow-y-auto space-y-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const channelSymbols: Record<string, string> = { email: '✉️', phone: '📞', social: '💬' };
              return (
                <div key={log.id} className="border-b border-[#00D4FF]/5 pb-2 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-extrabold uppercase">{channelSymbols[log.channel] || '📨'} {log.channel}</span>
                    <span className="text-neutral-500 text-[8px]">{new Date(log.sent_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[9px] text-neutral-400 leading-relaxed mt-0.5 italic truncate">&quot;{log.message?.substring(0, 80)}...&quot;</p>
                </div>
              );
            })
          ) : (
            <div className="text-center text-neutral-500 text-[10px] py-4 italic">No outreach logged yet. Use Initiate Outreach to begin.</div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="diag-stat-card">
        <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#00D4FF]" /> Analyst Notes
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-black/50 border border-[#00D4FF]/20 w-full h-[100px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all placeholder-neutral-600 resize-none"
          placeholder="ENTER ANALYST NOTES HERE..."
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="inline-flex items-center gap-1.5 bg-[#39FF14] text-[#080C18] px-3 py-1.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer hover:bg-[#39FF14]/90 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// TAB 6: POSTS (LINKEDIN)
// ==============================================================
interface PostsTabProps {
  lead: Lead;
  posts: any[];
  setPosts: (posts: any[]) => void;
}

function PostsTab({ lead, posts, setPosts }: PostsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleFetchPosts = async () => {
    const parsed = parseLeadNotes(lead.notes || '');
    if (!parsed.linkedinUrl || parsed.linkedinUrl === 'N/A') {
      setError('No LinkedIn Profile URL found for this contact.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/scrape/linkedin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsed.linkedinUrl, limit: 5 })
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        setPosts(data.posts);
        showToast('Successfully scraped recent posts', 'success');
      } else {
        setError('No recent posts found for this user.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 font-mono text-[11px]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] text-white font-extrabold uppercase tracking-widest">
          Recent LinkedIn Activity
        </div>
        <button
          onClick={handleFetchPosts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A66C2]/15 border border-[#0A66C2]/35 hover:bg-[#0A66C2]/25 text-[#0A66C2] disabled:opacity-50 rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer transition-all"
        >
          {loading ? (
            <><RefreshCw className="w-3 h-3 animate-spin" /> Scraping...</>
          ) : (
            <><Linkedin className="w-3 h-3" /> Scrape Posts</>
          )}
        </button>
      </div>

      {error && (
        <div className="text-[#FF3366] bg-[#FF3366]/10 border border-[#FF3366]/20 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading && !error && (
        <div className="text-center text-neutral-500 py-10 border border-dashed border-neutral-800 rounded">
          No posts scraped yet. Click &quot;Scrape Posts&quot; to fetch recent activity.
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post, i) => (
          <div key={i} className="diag-stat-card bg-[#0A0E1A]/60">
            <div className="text-neutral-400 mb-3 whitespace-pre-wrap leading-relaxed">
              {post.text || post.content || 'No text content'}
            </div>
            <div className="flex items-center gap-4 text-[9px] text-neutral-500 border-t border-neutral-800 pt-2 mt-2">
              <span className="flex items-center gap-1"><span className="text-[#00D4FF]">👍</span> {post.numLikes || post.likesCount || 0} Likes</span>
              <span className="flex items-center gap-1"><span className="text-[#FFB800]">💬</span> {post.numComments || post.commentsCount || 0} Comments</span>
              {post.postUrl && (
                <a href={post.postUrl} target="_blank" rel="noreferrer" className="ml-auto text-[#0A66C2] hover:underline flex items-center gap-1">
                  View on LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
