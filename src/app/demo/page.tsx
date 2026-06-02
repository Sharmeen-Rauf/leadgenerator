'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Globe, ShieldCheck, ShieldX, Check, Copy, Plus, Loader2, ArrowUpRight,
  Sliders, FileText, Video, Play, Pause, RefreshCw, AlertTriangle, ChevronRight,
  TrendingDown, CheckSquare, X, Users, Activity, BarChart2, Mail, Settings, Link2, Zap
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ToastProvider, useToast } from '../../components/ui/Toast';

// ─── Custom Icons ──────────────────────────────────────────────────────────

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

// ─── Constants & Types ──────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviews: number;
  website: string;
  phone: string;
  gapScore: number;
  diagnostic?: DiagnosticData;
  competitors?: Competitor[];
}

interface DiagnosticData {
  opportunityScore: number;
  estimatedRevenueLoss: string;
  dealValue: string;
  platform: string;
  speedScore: string;
  seoScore: string;
  gaps: {
    seo: number;
    social: number;
    email: number;
    ads: number;
    web: number;
  };
  vulnerabilities: string[];
  aiStrategicAnalysis: string;
  bestServiceToPitch: string;
}

interface Competitor {
  name: string;
  runningAds: boolean;
  websiteSpeed: string;
  googleRank: string;
  edge: string;
}

const MOCK_LEADS_DATABASE: Record<string, Lead[]> = {
  boston: [
    { id: 'bos-1', name: 'Apex Roofing & Siding', category: 'Roofing', city: 'Boston', rating: 3.9, reviews: 48, website: 'apexroofingboston.com', phone: '(617) 555-0192', gapScore: 87 },
    { id: 'bos-2', name: 'Beacon Dental Care', category: 'Dentist', city: 'Boston', rating: 4.2, reviews: 120, website: 'beacondentalboston.com', phone: '(617) 555-0143', gapScore: 62 },
    { id: 'bos-3', name: 'Boston Chiropractic Hub', category: 'Chiropractor', city: 'Boston', rating: 4.7, reviews: 18, website: 'bostonchirohub.com', phone: '(617) 555-0178', gapScore: 41 },
    { id: 'bos-4', name: 'Elite Auto Repair', category: 'Auto Repair', city: 'Boston', rating: 3.7, reviews: 94, website: 'eliteautoboston.com', phone: '(617) 555-0115', gapScore: 92 },
    { id: 'bos-5', name: 'Green Garden Landscaping', category: 'Landscaping', city: 'Boston', rating: 4.5, reviews: 32, website: 'greengardenboston.com', phone: '(617) 555-0167', gapScore: 55 }
  ],
  chicago: [
    { id: 'chi-1', name: 'Windy City Builders', category: 'General Contractor', city: 'Chicago', rating: 3.8, reviews: 31, website: 'windycitybuilders.net', phone: '(312) 555-0981', gapScore: 84 },
    { id: 'chi-2', name: 'Lincoln Park Dental Co.', category: 'Dentist', city: 'Chicago', rating: 4.1, reviews: 204, website: 'lpdentalchicago.com', phone: '(312) 555-0453', gapScore: 60 },
    { id: 'chi-3', name: 'Chicago Spine Clinic', category: 'Chiropractor', city: 'Chicago', rating: 4.8, reviews: 25, website: 'chicagospinecenter.org', phone: '(312) 555-0211', gapScore: 38 },
    { id: 'chi-4', name: 'Loop Automotive Pros', category: 'Auto Repair', city: 'Chicago', rating: 3.6, reviews: 72, website: 'loopautopros.com', phone: '(312) 555-0551', gapScore: 90 },
    { id: 'chi-5', name: 'Lakeside Tree Surgeons', category: 'Landscaping', city: 'Chicago', rating: 4.4, reviews: 49, website: 'lakesidetreesurgeons.com', phone: '(312) 555-0376', gapScore: 58 }
  ]
};

// ─── Mock Generators ────────────────────────────────────────────────────────

const getMockDiagnosticData = (lead: Lead): DiagnosticData => {
  const oppScore = 100 - lead.gapScore;
  const niche = lead.category || "Business";
  const city = lead.city || "Boston";
  
  const lossAmount = Math.round(lead.gapScore * 135);
  const dealValMin = Math.round(lossAmount * 8);
  const dealValMax = Math.round(lossAmount * 15);
  
  const platforms = ["WordPress", "Wix", "Squarespace", "Custom HTML", "GoDaddy"];
  const platform = platforms[lead.name.length % platforms.length];
  const speeds = ["Slow (4.8s)", "Critically Slow (6.2s)", "Moderate (3.1s)", "Poor (5.1s)"];
  const speed = speeds[lead.name.length % speeds.length];
  
  const seoScore = Math.max(25, Math.min(85, Math.round(100 - lead.gapScore - (lead.name.length % 10))));
  
  const vulnerabilities = [
    `No Facebook Pixel or Google Ads Tag detected on ${lead.website}`,
    `Poor mobile page speed index: ${speed}`,
    `Missing structured local schema markup in ${city} for ${niche}`,
    lead.gapScore > 75 ? `Website connection triggers SSL security alerts` : `Missing viewport tags causing mobile text wrapping issues`,
    `No open graph metadata tags for social media previews`
  ].filter((_, i) => (i + lead.name.length) % 5 < 3 || lead.gapScore > 70);

  const bestService = lead.gapScore > 80 
    ? "Fast Landing Page Redesign & Google Ads Setup" 
    : lead.gapScore > 60 
      ? "Local SEO Dominance & Schema Implementation" 
      : "Retargeting Ads & Facebook Pixel Setup";

  return {
    opportunityScore: oppScore,
    estimatedRevenueLoss: `$${lossAmount.toLocaleString()}/mo`,
    dealValue: `$${dealValMin.toLocaleString()}–$${dealValMax.toLocaleString()}/yr`,
    platform,
    speedScore: speed,
    seoScore: `${seoScore}/100`,
    gaps: {
      seo: Math.round(lead.gapScore * 0.95),
      social: Math.round(lead.gapScore * 0.8),
      email: Math.round(lead.gapScore * 0.65),
      ads: Math.round(lead.gapScore * 0.9),
      web: Math.round(lead.gapScore * 0.75)
    },
    vulnerabilities,
    aiStrategicAnalysis: `Based on current metrics, ${lead.name} has serious organic exposure gaps in ${city}. Pitching our ${bestService} package directly solves their high estimated leakage of $${lossAmount.toLocaleString()}/mo before rivals capture their traffic.`,
    bestServiceToPitch: bestService
  };
};

const getMockCompetitors = (leadName: string, category: string, city: string): Competitor[] => {
  return [
    {
      name: `${city} ${category} Pros`,
      runningAds: true,
      websiteSpeed: "Fast (1.2s)",
      googleRank: "Rank #1 (Page 1)",
      edge: "Highly active Google Ads spend. We can beat them on local organic SEO by targeting long-tail neighborhood terms."
    },
    {
      name: `Evergreen ${category} Co`,
      runningAds: false,
      websiteSpeed: "Fast (1.8s)",
      googleRank: "Rank #3 (Page 1)",
      edge: "Great website speed, but zero social retargeting. We can run retargeting ads to swipe their bounce traffic."
    },
    {
      name: `Sovereign ${category} Group`,
      runningAds: true,
      websiteSpeed: "Slow (4.1s)",
      googleRank: "Rank #9 (Page 1)",
      edge: "They have slow site speeds. Our proposed lightweight redesign will easily outrank them in local organic queries."
    }
  ];
};

const getMockEmail = (lead: Lead, type: string, tone: string): string => {
  const name = lead.name;
  const category = lead.category || "business";
  const city = lead.city || "your area";
  const speed = lead.diagnostic?.speedScore || "Slow (4.8s)";
  const loss = lead.diagnostic?.estimatedRevenueLoss || "$1,200/mo";
  
  if (type === 'cold') {
    if (tone === 'casual') {
      return `Subject: Quick question about ${name}

Hi Team,

I was checking out local ${category} services in ${city} and landed on your site. 

Your customer reviews look great, but I noticed the site itself loads a bit slow (${speed}). In your space, a delay like that usually turns away about 30% of mobile visitors.

We ran a quick calculation and estimate you might be leaking around ${loss} in potential bookings because of this.

We built a quick mockup showing how a faster layout could capture those leads. Open to seeing it?

Best,
[Your Name]`;
    } else if (tone === 'urgent') {
      return `Subject: Urgent conversion leak detected on ${lead.website}

Hello,

A security/performance scan on ${name} has identified critical customer-loss vulnerabilities.

Your site is currently loading at ${speed}, which fails Google Core Web Vitals. Additionally, missing retargeting pixels mean you are losing 98% of your paid traffic forever.

Our diagnostic model estimates your digital revenue leakage is at least ${loss} per month.

Your direct local competitors are already running optimized campaigns to capture these exact lost visitors. We can plug this leak in 48 hours. Let's schedule a call today to lock down your territory.

Regards,
[Your Name]`;
    } else {
      return `Subject: Technical audit report for ${name}

Dear Team,

I am writing to share a brief technical assessment we completed for ${name} in ${city}.

Our audit identified three high-impact digital gaps:
1. Performance Index: ${speed} causing high mobile bounce rates.
2. Search Rankings: Missing critical local schema tags.
3. Revenue Leak: An estimated monthly loss of ${loss}.

We specialize in performance upgrades for the ${category} industry. I would welcome the opportunity to walk you through our full diagnostic report.

Are you available for a brief 10-minute consultation this Thursday?

Sincerely,
[Your Name]`;
    }
  } else if (type === 'followup') {
    return `Subject: Re: Technical audit report for ${name}

Hi Team,

Following up on the audit report I sent last week regarding ${name}.

I've put together a 30-day roadmap showing how fixing your site performance (${speed}) and local visibility could recover up to ${loss} in monthly value.

It takes under 10 minutes to run through the details. Would any time tomorrow afternoon work for a quick chat?

Best,
[Your Name]`;
  } else {
    return `Subject: Proposal: Digital Growth Strategy for ${name}

Dear Team,

Based on our recent diagnostics, we are pleased to submit our growth and recovery proposal for ${name}.

Scope of Work:
• Mobile Speed Acceleration: Optimization down to <2s load times.
• Google Local SEO Setup: Target top local keywords in ${city}.
• Retargeting Infrastructure: Install Facebook/Google pixels to capture lost leads.

Estimated Impact: Recovery of ${loss}/mo in revenue leakage.

I have attached our full proposal here. Let me know when you would like to review the implementation timeline.

Best regards,
[Your Name]`;
  }
};

const getMockVideoScript = (lead: Lead): string => {
  const name = lead.name;
  const category = lead.category || "business";
  const city = lead.city || "your area";
  const speed = lead.diagnostic?.speedScore || "Slow (4.8s)";
  const loss = lead.diagnostic?.estimatedRevenueLoss || "$1,200/mo";
  
  return `[INTRO 0-10s]
"Hey there! I'm recording this quick video specifically for the team at ${name}. I was researching ${category} services in ${city} and wanted to point out something critical on your website that might be costing you customers."

[PAIN POINT 10-25s]
"So, I ran a performance diagnostic on ${lead.website || 'your site'} and saw that it's taking about ${speed} to load on mobile. What this actually means is that about 30 to 40% of the people who click on your business from Google are bouncing off and hitting your competitors instead because it's loading too slowly."

[PROOF 25-45s]
"According to our agency diagnostic model, this performance gap is costing you an estimated ${loss} every single month in leaked revenue. I've got a side-by-side audit of your local competitors here, and they're running page speeds under 2 seconds. The good news is, we can fix this easily without rebuilding your entire site."

[CTA 45-60s]
"I would love to send over a quick 2-page roadmap showing exactly how to plug this leak. If you're open to taking a look, just reply to this email, or book a quick 5-minute chat using the calendar link below this video. Have a great day!"`;
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <ToastProvider>
      <DemoConsole />
    </ToastProvider>
  );
}

function DemoConsole() {
  const { showToast } = useToast();
  
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'scraper' | 'diagnostics' | 'outreach' | 'calculator'>('scraper');
  const [isPublicReport, setIsPublicReport] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Scraper State
  const [searchQuery, setSearchQuery] = useState('Dentists Boston');
  const [scanning, setScanning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Diagnostic State
  const [diagnosing, setDiagnosing] = useState(false);
  
  // Outreach State
  const [outreachLeadId, setOutreachLeadId] = useState<string>('');
  const [emailType, setEmailType] = useState('cold');
  const [emailTone, setEmailTone] = useState('professional');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [outreachTab, setOutreachTab] = useState<'email' | 'video'>('email');
  
  // Video Teleprompter Script State
  const [generatingScript, setGeneratingScript] = useState(false);
  const [videoScript, setVideoScript] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(25); // ms per pixel
  
  // Calculator States
  const [visitors, setVisitors] = useState(2500);
  const [conversionRate, setConversionRate] = useState(1.5);
  const [avgClientValue, setAvgClientValue] = useState(1500);
  
  // Stripe Sandbox State
  const [isProUser, setIsProUser] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  // Sync outreach dropdown when lead is selected
  useEffect(() => {
    if (selectedLead) {
      setOutreachLeadId(selectedLead.id);
    }
  }, [selectedLead]);

  // Handle URL router mapping for shareable reports
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('report') === 'true') {
      setIsPublicReport(true);
      
      // Auto build a lead for report rendering
      const mockLead: Lead = {
        id: 'report-demo',
        name: params.get('company') || 'Apex Local Service Inc.',
        category: params.get('niche') || 'Dentist',
        city: params.get('city') || 'Boston',
        rating: 3.9,
        reviews: 42,
        website: params.get('site') || 'apexlocalservices.com',
        phone: '(555) 019-9831',
        gapScore: Number(params.get('score')) || 78
      };
      
      mockLead.diagnostic = getMockDiagnosticData(mockLead);
      mockLead.competitors = getMockCompetitors(mockLead.name, mockLead.category, mockLead.city);
      setSelectedLead(mockLead);
    }
  }, []);

  // Teleprompter Autoscroll hook
  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const el = scrollContainerRef.current;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
            // Reached bottom, pause
            setIsScrolling(false);
          } else {
            el.scrollTop += 1;
          }
        }
      }, scrollSpeed);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  // ─── Feature Actions ──────────────────────────────────────────────────────

  const handleScanTargets = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter an industry and city', 'error');
      return;
    }

    setScanning(true);
    setLeads([]);
    
    // Simulate tactical radar sweep delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const query = searchQuery.toLowerCase();
    let selectedMock = MOCK_LEADS_DATABASE.boston;
    
    if (query.includes('chicago')) {
      selectedMock = MOCK_LEADS_DATABASE.chicago;
    } else {
      // Modify mock data details dynamically based on search query
      const words = searchQuery.split(/\s+/);
      const industry = words[0] || 'Dentist';
      const city = words[1] || 'Boston';
      selectedMock = MOCK_LEADS_DATABASE.boston.map((lead, idx) => ({
        ...lead,
        category: industry.charAt(0).toUpperCase() + industry.slice(1),
        city: city.charAt(0).toUpperCase() + city.slice(1),
        name: lead.name.replace('Roofing', industry.charAt(0).toUpperCase() + industry.slice(1)).replace('Dental', industry.charAt(0).toUpperCase() + industry.slice(1)).replace('Chiropractic', industry.charAt(0).toUpperCase() + industry.slice(1)).replace('Auto', industry.charAt(0).toUpperCase() + industry.slice(1)).replace('Garden', industry.charAt(0).toUpperCase() + industry.slice(1))
      }));
    }

    setLeads(selectedMock);
    setScanning(false);
    showToast(`Radar sweep resolved ${selectedMock.length} nodes!`, 'success');
  };

  const handleAnalyzeLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setActiveTab('diagnostics');
    setDiagnosing(true);
    
    // Simulate diagnostic sensor telemetry
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Try server side proxy endpoint first, fallback to mock data generator
    try {
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: "You are a B2B sales intelligence AI. Given a local business, analyze their digital marketing vulnerabilities. Return JSON only: { opportunityScore: number 0-100, estimatedRevenueLoss: string like '$4,500/mo', dealValue: string like '$13,500–$27,000/yr', platform: string, speedScore: string like 'Slow (4.8s)', seoScore: string like '32/100', gaps: { seo: number, social: number, email: number, ads: number, web: number }, vulnerabilities: string[], aiStrategicAnalysis: string (2 sentences personalized pitch advice), bestServiceToPitch: string }",
          prompt: `Analyze this business: ${lead.name}, ${lead.category}, ${lead.city}. Rating: ${lead.rating}/5 with ${lead.reviews} reviews.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Extract content from Claude message structure
        const rawText = data.content[0].text;
        // Clean JSON formatting markdown flags if any
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiResult = JSON.parse(cleanedText);
        
        lead.diagnostic = {
          opportunityScore: aiResult.opportunityScore,
          estimatedRevenueLoss: aiResult.estimatedRevenueLoss,
          dealValue: aiResult.dealValue,
          platform: aiResult.platform,
          speedScore: aiResult.speedScore,
          seoScore: aiResult.seoScore,
          gaps: {
            seo: aiResult.gaps.seo || 50,
            social: aiResult.gaps.social || 50,
            email: aiResult.gaps.email || 50,
            ads: aiResult.gaps.ads || 50,
            web: aiResult.gaps.web || 50
          },
          vulnerabilities: aiResult.vulnerabilities,
          aiStrategicAnalysis: aiResult.aiStrategicAnalysis,
          bestServiceToPitch: aiResult.bestServiceToPitch
        };
      } else {
        throw new Error('Proxy returned error, running fallback simulation.');
      }
    } catch (err) {
      console.log('Using robust offline fallback for diagnostic AI scoring.');
      lead.diagnostic = getMockDiagnosticData(lead);
    }

    // Bind competitor audit values
    lead.competitors = getMockCompetitors(lead.name, lead.category, lead.city);
    
    // Update active memory
    setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    setSelectedLead({ ...lead });
    setDiagnosing(false);
    showToast('AI diagnostics scan fully telemetry-mapped!', 'success');
  };

  const handleGeneratePitch = async () => {
    const lead = leads.find(l => l.id === outreachLeadId);
    if (!lead) {
      showToast('Please select a resolved lead node first', 'error');
      return;
    }

    setGeneratingEmail(true);
    setEmailResult('');

    if (!lead.diagnostic) {
      lead.diagnostic = getMockDiagnosticData(lead);
    }

    // Try proxy endpoint
    try {
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a personalized cold outreach email from a digital marketing agency to ${lead.name}. They have these vulnerabilities: ${lead.diagnostic.vulnerabilities.join(', ')}. Keep it under 150 words, conversational, mention one specific pain point with a dollar amount. Subject line included.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailResult(data.content[0].text);
      } else {
        throw new Error('Email API failed, using fallback.');
      }
    } catch {
      setEmailResult(getMockEmail(lead, emailType, emailTone));
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleGenerateVideoScript = async () => {
    const lead = leads.find(l => l.id === outreachLeadId);
    if (!lead) {
      showToast('Please select a resolved lead node first', 'error');
      return;
    }

    setGeneratingScript(true);
    setVideoScript('');

    if (!lead.diagnostic) {
      lead.diagnostic = getMockDiagnosticData(lead);
    }

    // Run short teleprompter generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setVideoScript(getMockVideoScript(lead));
    setGeneratingScript(false);
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Text copied to clipboard!', 'success');
  };

  const handleGenerateReportLink = () => {
    const targetLead = selectedLead || leads[0];
    if (!targetLead) {
      showToast('Please run a scan and analyze a lead first', 'error');
      return;
    }
    
    const slug = encodeURIComponent(targetLead.name);
    const score = targetLead.gapScore;
    const path = `/demo?report=true&company=${slug}&score=${score}&niche=${encodeURIComponent(targetLead.category)}&city=${encodeURIComponent(targetLead.city)}&site=${encodeURIComponent(targetLead.website)}`;
    
    const absoluteUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(absoluteUrl);
    showToast('Branded report link copied to clipboard!', 'success');
  };

  // Calculator formula live calculations
  const monthlyLeakage = Math.round(visitors * (conversionRate / 100) * avgClientValue * 0.3);

  // Stripe Upgrade Simulation
  const handleUpgradeToPro = () => {
    setIsProUser(true);
    setShowStripeModal(false);
    showToast('PRO LICENSE DEPLOYED. Unlimited lead scans enabled!', 'success');
  };

  // Limit leads visible to free sandbox users
  const displayedLeads = isProUser ? leads : leads.slice(0, 3);
  const hiddenLeadsCount = leads.length - displayedLeads.length;

  // ─── Render Public Report View ─────────────────────────────────────────────

  if (isPublicReport && selectedLead && selectedLead.diagnostic) {
    const diag = selectedLead.diagnostic;
    return (
      <div className="min-h-screen bg-[#070A14] text-neutral-300 font-mono flex flex-col p-6 md:p-12 relative overflow-hidden">
        {/* Neon decorative background stars */}
        <div className="absolute top-[-10%] left-[-15%] w-[45vw] h-[45vw] bg-radial from-[#00ffc8]/5 to-transparent rounded-full pointer-events-none filter blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[45vw] h-[45vw] bg-radial from-[#39ff14]/5 to-transparent rounded-full pointer-events-none filter blur-3xl"></div>

        {/* Branded public header */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-[#00ffc8]/20 pb-5 mb-8">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00ffc8]" />
            <span className="font-extrabold uppercase text-white tracking-widest text-sm font-['Syne']">PitchRadar Audit Suite</span>
          </div>
          <Badge variant="cyan">CLIENT-READY REPORT</Badge>
        </div>

        {/* Report Main Sheet */}
        <div className="max-w-4xl w-full mx-auto bg-[#101625]/60 border border-[#00ffc8]/15 rounded-lg p-6 md:p-10 backdrop-blur-xl space-y-8 shadow-[0_0_20px_rgba(0,255,200,0.05)]">
          
          {/* Diagnostic overview box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-neutral-800 pb-8">
            <div className="md:col-span-2 space-y-2">
              <span className="text-[10px] text-[#00ffc8] font-bold uppercase tracking-widest">Digital Vulnerability Analysis</span>
              <h2 className="text-2xl font-black text-white uppercase">{selectedLead.name}</h2>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">{selectedLead.category} • {selectedLead.city} Branch</p>
            </div>
            
            {/* Big Opportunity dial */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#070A14] border border-neutral-800 rounded-lg text-center">
              <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest mb-1.5">Opportunity Priority</span>
              <div className={`text-3xl font-black ${diag.opportunityScore > 75 ? 'text-[#FF3366]' : diag.opportunityScore > 50 ? 'text-[#FFB800]' : 'text-[#39FF14]'}`}>
                {diag.opportunityScore}/100
              </div>
              <span className="text-[8px] text-neutral-400 uppercase tracking-widest mt-1 font-bold">
                {diag.opportunityScore > 75 ? 'CRITICAL LEVEL' : diag.opportunityScore > 50 ? 'WARNING LEVEL' : 'OPTIMAL'}
              </span>
            </div>
          </div>

          {/* Scores details row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#070A14] border border-neutral-800 p-3.5 rounded text-center">
              <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Mobile Loading Speed</div>
              <div className="text-xs font-bold text-white mt-1.5">{diag.speedScore}</div>
            </div>
            <div className="bg-[#070A14] border border-neutral-800 p-3.5 rounded text-center">
              <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Local SEO Score</div>
              <div className="text-xs font-bold text-white mt-1.5">{diag.seoScore}</div>
            </div>
            <div className="bg-[#070A14] border border-neutral-800 p-3.5 rounded text-center">
              <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Est. Monthly Leakage</div>
              <div className="text-xs font-bold text-[#FF3366] mt-1.5">{diag.estimatedRevenueLoss}</div>
            </div>
            <div className="bg-[#070A14] border border-neutral-800 p-3.5 rounded text-center">
              <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Platform Core</div>
              <div className="text-xs font-bold text-white mt-1.5">{diag.platform}</div>
            </div>
          </div>

          {/* Core vulnerabilities checklist */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Detected Gaps & Vulnerabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diag.vulnerabilities.map((vuln, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-3 bg-red-950/15 border border-red-500/15 rounded text-[10px] text-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FF3366] shrink-0 mt-0.5" />
                  <span>{vuln}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Audit comparison table */}
          {selectedLead.competitors && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Local Competitor Comparison Matrix</h3>
              <div className="overflow-x-auto border border-neutral-800 rounded">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-[#070A14] text-neutral-450 uppercase font-bold">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3 text-center">Running Ads</th>
                      <th className="py-2.5 px-3 text-center">Mobile Speed</th>
                      <th className="py-2.5 px-3 text-center">Search Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300 font-semibold">
                    <tr className="bg-[#00ffc8]/5 font-bold">
                      <td className="py-2.5 px-3 uppercase text-white">{selectedLead.name} (You)</td>
                      <td className="py-2.5 px-3 text-center text-red-500">No Check tags</td>
                      <td className="py-2.5 px-3 text-center text-red-400">{diag.speedScore}</td>
                      <td className="py-2.5 px-3 text-center text-red-400">Page 3+</td>
                    </tr>
                    {selectedLead.competitors.map((comp, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-neutral-450">{comp.name}</td>
                        <td className="py-2.5 px-3 text-center">{comp.runningAds ? <span className="text-[#39FF14]">Yes</span> : <span className="text-neutral-600">No</span>}</td>
                        <td className="py-2.5 px-3 text-center text-neutral-400">{comp.websiteSpeed}</td>
                        <td className="py-2.5 px-3 text-center text-neutral-400">{comp.googleRank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Call to action section */}
          <div className="bg-[#070A14] border border-[#00ffc8]/15 rounded-lg p-6 text-center space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Ready to Plug the Revenue Leak?</h4>
            <p className="text-[10px] text-neutral-400 max-w-lg mx-auto uppercase tracking-wide">
              We have put together a specialized fix plan targeting these exact performance, SEO, and tracking gaps. Let's schedule a free 10-minute workshop to review the fixes.
            </p>
            <Button
              variant="cyan"
              size="sm"
              onClick={() => showToast('Fix strategy workshop scheduled! Check your inbox.', 'success')}
            >
              Book Complimentary Fix Workshop
            </Button>
          </div>

        </div>

        {/* Standalone link copy banner */}
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center mt-6 text-[9px] text-neutral-500 font-bold uppercase">
          <span>PitchRadar Secure Report: PR-DIAG-{selectedLead.id.toUpperCase()}</span>
          <button onClick={() => setIsPublicReport(false)} className="text-[#00ffc8] hover:underline cursor-pointer">
            Return to Dashboard HUD
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Dashboard HUD ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#070A14] text-neutral-300 font-mono select-none flex flex-col relative overflow-hidden">
      {/* Decors background aura */}
      <div className="absolute top-[5%] left-[10%] w-[35vw] h-[35vw] bg-radial from-[#00ffc8]/5 to-transparent rounded-full pointer-events-none filter blur-3xl"></div>
      
      {/* ── TopNav Panel ── */}
      <header className="border-b border-[#00D4FF]/15 bg-[#070A14]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-[#0A0E1A] rounded-lg flex items-center justify-center border border-[#00D4FF]/30 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <Zap className="w-4 h-4 text-[#00D4FF] fill-[#00D4FF]/20" />
          </div>
          <div>
            <div className="font-['Syne'] text-[17px] font-extrabold tracking-wider text-white uppercase hud-glow-cyan">PitchRadar AI</div>
            <div className="text-[8px] text-[#00D4FF]/75 tracking-widest uppercase mt-0.5 font-bold">Lead Intelligence Demonstration Console</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-black/40 border border-[#00D4FF]/10 rounded-full px-3 py-1 text-[8px] font-bold text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] absolute" />
            <span className="ml-1 uppercase tracking-widest">LIVE SENSOR ONLINE</span>
          </div>
          
          <button 
            onClick={() => setShowStripeModal(true)}
            className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase border transition-all cursor-pointer ${
              isProUser 
                ? 'bg-[#39FF14]/15 border-[#39FF14]/30 text-[#39FF14] shadow-[0_0_6px_rgba(57,255,20,0.1)]' 
                : 'bg-[#00ffc8]/10 border-[#00ffc8]/30 text-[#00ffc8] hover:bg-[#00ffc8]/25 shadow-[0_0_6px_rgba(0,255,200,0.1)]'
            }`}
          >
            {isProUser ? 'PRO LICENSE ACTIVE' : 'UPGRADE TO PRO'}
          </button>
        </div>
      </header>

      {/* ── Outer Shell Grid ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Nav */}
        <aside className="w-[200px] border-r border-[#00D4FF]/15 bg-[#070A14]/50 flex flex-col p-4 space-y-1.5">
          <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest px-3 mb-2">TELEMETRY SECTIONS</span>
          
          <button
            onClick={() => setActiveTab('scraper')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-[10px] font-extrabold uppercase border transition-all text-left cursor-pointer ${
              activeTab === 'scraper'
                ? 'bg-[#00ffc8]/10 border-[#00ffc8]/40 text-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.1)]'
                : 'border-transparent text-neutral-450 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lead Scraper</span>
          </button>
          
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-[10px] font-extrabold uppercase border transition-all text-left cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-[#00ffc8]/10 border-[#00ffc8]/40 text-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.1)]'
                : 'border-transparent text-neutral-450 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-[10px] font-extrabold uppercase border transition-all text-left cursor-pointer ${
              activeTab === 'outreach'
                ? 'bg-[#00ffc8]/10 border-[#00ffc8]/40 text-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.1)]'
                : 'border-transparent text-neutral-450 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Outreach Panel</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-[10px] font-extrabold uppercase border transition-all text-left cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-[#00ffc8]/10 border-[#00ffc8]/40 text-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.1)]'
                : 'border-transparent text-neutral-450 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Leak Calculator</span>
          </button>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ─── TAB 1: Lead Scraper View ─── */}
          {activeTab === 'scraper' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Radar Input Panel */}
              <div className="tactical-glass p-5 border-[#00ffc8]/15">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
                  <Search className="w-4 h-4 text-[#00ffc8]" />
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Google Maps Local Search Engine</h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-wider">Search Parameter (Industry + City)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-[#080C18]/90 border border-neutral-800 rounded pl-10 pr-4 py-2.5 w-full text-xs outline-none focus:border-[#00ffc8] text-white font-semibold transition-all uppercase"
                        placeholder="e.g. Roofers Chicago, Dentists Boston"
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={handleScanTargets}
                    loading={scanning}
                    disabled={scanning || !searchQuery.trim()}
                  >
                    Initiate Radar Sweep
                  </Button>
                </div>
              </div>

              {/* Scanned Results Display */}
              {scanning && (
                <div className="flex flex-col items-center justify-center py-20 bg-black/30 border border-neutral-800 rounded-lg space-y-3">
                  <Loader2 className="w-8 h-8 text-[#00ffc8] animate-spin" />
                  <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest animate-pulse">Running Sensor Scans... sweeping sector...</span>
                </div>
              )}

              {leads.length > 0 && !scanning && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Scanned Targets Buffer ({displayedLeads.length} Nodes Rendered)</span>
                    {!isProUser && (
                      <span className="text-[9px] text-[#FFB800] font-black uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setShowStripeModal(true)}>
                        Free Tier Active: upgrade to reveal {hiddenLeadsCount} more results
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {displayedLeads.map((lead, idx) => (
                      <div key={lead.id} className="tactical-glass p-5 border-[#00ffc8]/15 hover:border-[#00ffc8]/40 transition-all flex flex-col justify-between space-y-4 relative group">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wide group-hover:text-[#00ffc8] transition-colors">{lead.name}</h4>
                              <p className="text-[8px] text-neutral-500 uppercase mt-0.5 tracking-wider">{lead.category} • {lead.city}</p>
                            </div>
                            
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border leading-none ${
                              lead.gapScore > 75 
                                ? 'bg-red-950/20 border-red-500/30 text-red-400' 
                                : lead.gapScore > 50 
                                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' 
                                  : 'bg-green-950/20 border-green-500/30 text-green-400'
                            }`}>
                              GAP: {lead.gapScore}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9px] text-neutral-450 border-t border-neutral-850 pt-2.5 font-bold uppercase">
                            <div>Rating: <span className="text-white">{lead.rating} ★</span></div>
                            <div>Reviews: <span className="text-white">{lead.reviews}</span></div>
                            <div className="col-span-2 truncate">Site: <span className="text-[#00ffc8] hover:underline lowercase">{lead.website}</span></div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-neutral-850">
                          <Button
                            variant="cyan"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => handleAnalyzeLead(lead)}
                          >
                            Analyze Vulnerabilities
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pro Limit Paywall block */}
                  {!isProUser && hiddenLeadsCount > 0 && (
                    <div className="tactical-glass p-6 border-dashed border-[#FFB800]/20 bg-[#FFB800]/5 rounded text-center space-y-3">
                      <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wide max-w-md mx-auto">
                        Your free license limits scanning visualization to 3 targets. Upgrading to a PRO account unlocks unlimited lead extraction and deep automated diagnostics.
                      </p>
                      <Button
                        variant="amber"
                        size="sm"
                        onClick={() => setShowStripeModal(true)}
                      >
                        Upgrade to Pro License ($49/mo)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: Diagnostics View ─── */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Telemetry diagnostics details */}
              {!selectedLead && !diagnosing && (
                <div className="tactical-glass p-20 border-dashed border-neutral-800 text-center flex flex-col items-center justify-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-neutral-600 animate-pulse" />
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Telemetry Unresolved. Please initiate scanner sweep and select a business node.</span>
                  <Button variant="cyan" size="sm" onClick={() => setActiveTab('scraper')} className="mt-2">
                    Back to Lead Scraper
                  </Button>
                </div>
              )}

              {diagnosing && (
                <div className="flex flex-col items-center justify-center py-24 bg-black/30 border border-neutral-800 rounded-lg space-y-4">
                  <Loader2 className="w-10 h-10 text-[#00ffc8] animate-spin" />
                  <div className="text-center space-y-1">
                    <span className="text-[10px] text-white font-extrabold uppercase tracking-widest animate-pulse">Running Deep Sensor Sweeps...</span>
                    <p className="text-[8px] text-neutral-500 uppercase tracking-wider">AI telemetry mapping vulnerabilities and competitors...</p>
                  </div>
                </div>
              )}

              {selectedLead && selectedLead.diagnostic && !diagnosing && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Vulnerability details panel */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Big Score Header banner */}
                    <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[8px] text-[#00ffc8] font-black uppercase tracking-widest">Active Diagnostic Node</span>
                          <h3 className="text-lg font-black text-white uppercase mt-0.5">{selectedLead.name}</h3>
                        </div>
                        <Badge variant="pink">ACTIVE SCAN</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-850 pt-4">
                        <div className="bg-black/35 border border-neutral-850 p-3 rounded">
                          <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Est. Monthly Leakage</span>
                          <div className="text-sm font-black text-[#FF3366] mt-1 uppercase">{selectedLead.diagnostic.estimatedRevenueLoss}</div>
                        </div>
                        <div className="bg-black/35 border border-neutral-850 p-3 rounded">
                          <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Estimated Contract Value</span>
                          <div className="text-sm font-black text-[#39FF14] mt-1 uppercase">{selectedLead.diagnostic.dealValue}</div>
                        </div>
                        <div className="bg-black/35 border border-neutral-850 p-3 rounded">
                          <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Platform Core</span>
                          <div className="text-sm font-black text-white mt-1 uppercase">{selectedLead.diagnostic.platform}</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress score breakdown bars */}
                    <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Weighted Gap Metrics</h4>
                      
                      <div className="space-y-3.5">
                        {Object.entries(selectedLead.diagnostic.gaps).map(([key, val]) => (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-neutral-450">
                              <span>{key} Weakness Ratio</span>
                              <span className="text-white">{val}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black border border-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  val > 75 
                                    ? 'bg-[#FF3366]' 
                                    : val > 50 
                                      ? 'bg-[#FFB800]' 
                                      : 'bg-[#39FF14]'
                                }`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Side-by-side Competitor Audit Spy */}
                    {selectedLead.competitors && (
                      <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-2">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Competitor Gap Spy</h4>
                          <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Local Rivals Audit</span>
                        </div>

                        <div className="overflow-x-auto border border-neutral-850 rounded">
                          <table className="w-full text-left border-collapse text-[9px]">
                            <thead>
                              <tr className="border-b border-neutral-850 bg-black/30 text-neutral-500 uppercase font-extrabold">
                                <th className="py-2.5 px-3">Company Name</th>
                                <th className="py-2.5 px-3 text-center">Running Ads</th>
                                <th className="py-2.5 px-3 text-center">Site Speed</th>
                                <th className="py-2.5 px-3 text-center">Google Rank</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-850 text-neutral-350 font-semibold uppercase">
                              <tr className="bg-[#00ffc8]/5 font-black">
                                <td className="py-2.5 px-3 text-white">{selectedLead.name} (You)</td>
                                <td className="py-2.5 px-3 text-center text-red-500">NO ADS</td>
                                <td className="py-2.5 px-3 text-center text-red-400">{selectedLead.diagnostic.speedScore}</td>
                                <td className="py-2.5 px-3 text-center text-red-400">Page 3+</td>
                              </tr>
                              {selectedLead.competitors.map((comp, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2.5 px-3 text-neutral-400">{comp.name}</td>
                                  <td className="py-2.5 px-3 text-center">{comp.runningAds ? <span className="text-[#39FF14]">YES</span> : <span className="text-neutral-600">NO</span>}</td>
                                  <td className="py-2.5 px-3 text-center">{comp.websiteSpeed}</td>
                                  <td className="py-2.5 px-3 text-center">{comp.googleRank}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Agency edge description */}
                        <div className="bg-black/40 border border-neutral-850 rounded p-3 text-[9px] space-y-1.5">
                          <span className="text-[#00ffc8] font-extrabold uppercase tracking-widest">TACTICAL ANALYSIS:</span>
                          <p className="text-neutral-450 uppercase leading-relaxed font-bold">
                            {selectedLead.competitors[0].edge}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar stats & action panel */}
                  <div className="space-y-6">
                    
                    {/* Dial Panel */}
                    <div className="tactical-glass p-5 border-[#00ffc8]/15 text-center flex flex-col items-center justify-center space-y-3">
                      <span className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Opportunity Rating</span>
                      <div className={`text-4xl font-black ${selectedLead.diagnostic.opportunityScore > 75 ? 'text-[#FF3366]' : selectedLead.diagnostic.opportunityScore > 50 ? 'text-[#FFB800]' : 'text-[#39FF14]'}`}>
                        {selectedLead.diagnostic.opportunityScore}%
                      </div>
                      <div className="w-full border-t border-neutral-850 pt-2 text-[8px] text-neutral-450 font-bold uppercase">
                        Gaps resolved: {selectedLead.diagnostic.vulnerabilities.length} points
                      </div>
                    </div>

                    {/* Checklist panel */}
                    <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Defect Registry</h4>
                      
                      <div className="space-y-2 text-[9px] font-bold text-red-200">
                        {selectedLead.diagnostic.vulnerabilities.map((v, i) => (
                          <div key={i} className="flex gap-2 items-start bg-red-950/15 border border-red-500/15 rounded p-2.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#FF3366] shrink-0 mt-0.5" />
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI strategic box */}
                    <div className="tactical-glass p-5 border-[#00ffc8]/25 bg-[#00ffc8]/5 space-y-3">
                      <div className="flex items-center gap-1.5 text-[#00ffc8] font-extrabold text-[9px] uppercase tracking-wider">
                        <Zap className="w-4 h-4 fill-[#00ffc8]/15" />
                        <span>AI Strategic Analysis</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 font-semibold uppercase leading-relaxed font-mono">
                        {selectedLead.diagnostic.aiStrategicAnalysis}
                      </p>
                    </div>

                    {/* Diagnostic Actions */}
                    <div className="flex flex-col gap-2.5">
                      <Button
                        variant="cyan"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => setIsPublicReport(true)}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> View Shareable Client Report
                      </Button>
                      
                      <Button
                        variant="green"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => {
                          setOutreachLeadId(selectedLead.id);
                          setActiveTab('outreach');
                        }}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1" /> Initiate Outreach Engine
                      </Button>

                      <button
                        onClick={handleGenerateReportLink}
                        className="text-[9px] text-[#00ffc8] font-extrabold uppercase hover:underline cursor-pointer tracking-wider text-center"
                      >
                        Copy Public Branded Report Link
                      </button>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* ─── TAB 3: AI Outreach & Scripting View ─── */}
          {activeTab === 'outreach' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Select layout */}
              <div className="tactical-glass p-5 border-[#00ffc8]/15">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Video className="w-4.5 h-4.5 text-[#00ffc8]" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">AI Copywriting & Video Teleprompter Console</h3>
                  </div>
                  
                  {/* Tab switches */}
                  <div className="flex border border-neutral-850 rounded overflow-hidden">
                    <button
                      onClick={() => setOutreachTab('email')}
                      className={`px-3 py-1.5 text-[9px] font-extrabold uppercase cursor-pointer ${
                        outreachTab === 'email' ? 'bg-[#00ffc8]/10 text-[#00ffc8]' : 'text-neutral-450 hover:text-white'
                      }`}
                    >
                      AI Email Writer
                    </button>
                    <button
                      onClick={() => setOutreachTab('video')}
                      className={`px-3 py-1.5 text-[9px] font-extrabold uppercase border-l border-neutral-850 cursor-pointer ${
                        outreachTab === 'video' ? 'bg-[#00ffc8]/10 text-[#00ffc8]' : 'text-neutral-450 hover:text-white'
                      }`}
                    >
                      Loom Video Teleprompter
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Select Lead */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Target Lead Node</label>
                    <select
                      value={outreachLeadId}
                      onChange={e => {
                        setOutreachLeadId(e.target.value);
                        setEmailResult('');
                        setVideoScript('');
                      }}
                      className="bg-black border border-neutral-800 rounded px-2.5 py-2 text-[10px] text-white focus:border-[#00ffc8] cursor-pointer outline-none font-bold"
                    >
                      <option value="">-- SELECT RESOLVED NODE --</option>
                      {leads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name} ({lead.city})</option>
                      ))}
                    </select>
                  </div>

                  {outreachTab === 'email' ? (
                    <>
                      {/* Email Angle */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Email Angle</label>
                        <select
                          value={emailType}
                          onChange={e => setEmailType(e.target.value)}
                          className="bg-black border border-neutral-800 rounded px-2.5 py-2 text-[10px] text-white focus:border-[#00ffc8] cursor-pointer outline-none font-bold animate-in fade-in"
                        >
                          <option value="cold">Cold Outreach</option>
                          <option value="followup">Outreach Follow-up</option>
                          <option value="proposal">Closing Proposal</option>
                        </select>
                      </div>

                      {/* Tone */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest">Copywriting Tone</label>
                        <select
                          value={emailTone}
                          onChange={e => setEmailTone(e.target.value)}
                          className="bg-black border border-neutral-800 rounded px-2.5 py-2 text-[10px] text-white focus:border-[#00ffc8] cursor-pointer outline-none font-bold animate-in fade-in"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual / Conversational</option>
                          <option value="urgent">Urgent / Scarcity</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="cyan"
                          size="sm"
                          className="w-full justify-center"
                          onClick={handleGeneratePitch}
                          loading={generatingEmail}
                          disabled={generatingEmail || !outreachLeadId}
                        >
                          Write AI Email Copy
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-3 flex items-end">
                      <Button
                        variant="cyan"
                        size="sm"
                        className="w-full md:w-auto md:ml-auto"
                        onClick={handleGenerateVideoScript}
                        loading={generatingScript}
                        disabled={generatingScript || !outreachLeadId}
                      >
                        Generate 60-Second Teleprompter Script
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Email output */}
              {outreachTab === 'email' && emailResult && (
                <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                    <span className="text-[9px] text-[#00ffc8] font-extrabold uppercase tracking-widest">AI Copywriting Terminal</span>
                    <button
                      onClick={() => handleCopyClipboard(emailResult)}
                      className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 text-[8px] font-extrabold uppercase cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Email Text
                    </button>
                  </div>

                  <pre className="bg-black/60 border border-neutral-850 rounded p-4 text-[10px] leading-relaxed text-neutral-350 whitespace-pre-wrap font-mono uppercase font-semibold">
                    {emailResult}
                  </pre>
                </div>
              )}

              {/* Video Teleprompter layout */}
              {outreachTab === 'video' && videoScript && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                  
                  {/* Left Column Teleprompter view */}
                  <div className="lg:col-span-2 tactical-glass p-5 border-[#00ffc8]/15 space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="text-red-500 w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[9px] text-[#FF3366] font-extrabold uppercase tracking-widest">Active Video Teleprompter Screen</span>
                      </div>
                      
                      {/* Teleprompter controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsScrolling(!isScrolling)}
                          className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-1 border border-neutral-850 rounded bg-black/40 hover:text-white cursor-pointer"
                        >
                          {isScrolling ? <Pause className="w-3 h-3 text-[#FFB800]" /> : <Play className="w-3 h-3 text-[#39FF14]" />}
                          <span>{isScrolling ? 'PAUSE SCROLLER' : 'PLAY TELEPROMPTER'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">Speed:</span>
                          <select
                            value={scrollSpeed}
                            onChange={e => setScrollSpeed(Number(e.target.value))}
                            className="bg-black border border-neutral-850 rounded text-[9px] text-white px-1.5 py-0.5 outline-none font-bold"
                          >
                            <option value="40">Slow</option>
                            <option value="25">Normal</option>
                            <option value="15">Fast</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Scrolling script box */}
                    <div 
                      ref={scrollContainerRef}
                      className="h-[280px] overflow-y-auto bg-black/80 border border-neutral-900 rounded p-6 font-mono text-sm leading-loose text-neutral-350 scroll-smooth custom-scrollbar select-none uppercase font-bold"
                    >
                      <pre className="whitespace-pre-wrap font-mono uppercase">
                        {videoScript}
                      </pre>
                    </div>
                  </div>

                  {/* Right Column loom tips panel */}
                  <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#00ffc8] pl-2">Loom Outreach Best Practices</h4>
                      
                      <div className="space-y-3 text-[9px] font-bold text-neutral-450 uppercase leading-relaxed">
                        <div className="bg-black/30 border border-neutral-850 p-2.5 rounded">
                          <span className="text-white block mb-1">1. Keep it under 60 seconds</span>
                          Mobile browser users have very short attention spans. Point out the leak instantly.
                        </div>
                        <div className="bg-black/30 border border-neutral-850 p-2.5 rounded">
                          <span className="text-white block mb-1">2. Use the competitor Gap Spy</span>
                          Mentioning specific competitors who run ads or load faster builds immediate urgency.
                        </div>
                        <div className="bg-black/30 border border-neutral-850 p-2.5 rounded">
                          <span className="text-white block mb-1">3. Simple CTA</span>
                          Do not sell your service in the video. Only ask for permission to send a 2-page fix roadmap.
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="cyan"
                      size="sm"
                      className="w-full justify-center mt-4"
                      onClick={() => handleCopyClipboard(videoScript.replace(/\[.*?\]\n/g, ''))}
                    >
                      Copy Clean Script Text
                    </Button>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ─── TAB 4: Revenue Calculator View ─── */}
          {activeTab === 'calculator' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sliders Console */}
                <div className="lg:col-span-2 tactical-glass p-5 border-[#00ffc8]/15 space-y-6">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                    <Sliders className="w-4.5 h-4.5 text-[#00ffc8]" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Revenue Leakage Estimator System</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Visitors Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                        <span>Monthly Website Traffic (Visitors)</span>
                        <span className="text-[#00ffc8]">{visitors.toLocaleString()} V/mo</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={visitors}
                        onChange={e => setVisitors(Number(e.target.value))}
                        className="w-full accent-[#00ffc8] cursor-pointer bg-neutral-850 h-1.5 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[7px] text-neutral-500 font-extrabold">
                        <span>500</span>
                        <span>10,000</span>
                      </div>
                    </div>

                    {/* Conversion Rate Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                        <span>Conversion Rate (Visitors to Leads %)</span>
                        <span className="text-[#00ffc8]">{conversionRate}% CR</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={conversionRate}
                        onChange={e => setConversionRate(Number(e.target.value))}
                        className="w-full accent-[#00ffc8] cursor-pointer bg-neutral-850 h-1.5 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[7px] text-neutral-500 font-extrabold">
                        <span>0.5%</span>
                        <span>5.0%</span>
                      </div>
                    </div>

                    {/* Avg Client Value Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                        <span>Average Client Deal Value ($)</span>
                        <span className="text-[#00ffc8]">${avgClientValue.toLocaleString()} U</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={avgClientValue}
                        onChange={e => setAvgClientValue(Number(e.target.value))}
                        className="w-full accent-[#00ffc8] cursor-pointer bg-neutral-850 h-1.5 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[7px] text-neutral-500 font-extrabold">
                        <span>$100</span>
                        <span>$10,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outputs Panel */}
                <div className="tactical-glass p-5 border-[#00ffc8]/15 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest block">Leakage telemetry</span>
                    
                    <div className="bg-black/45 border border-neutral-850 p-4 rounded text-center">
                      <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest">Est. Monthly Leakage</span>
                      <div className="text-2xl font-black text-[#FF3366] mt-2">${monthlyLeakage.toLocaleString()}/mo</div>
                      <p className="text-[7px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Based on 30% loss due to performance gaps</p>
                    </div>

                    <div className="bg-black/45 border border-neutral-850 p-4 rounded text-center">
                      <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest">Annual Leakage Toll</span>
                      <div className="text-xl font-black text-white mt-1.5">${(monthlyLeakage * 12).toLocaleString()}/yr</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-neutral-850">
                    <Button
                      variant="cyan"
                      size="sm"
                      className="w-full justify-center"
                      onClick={handleGenerateReportLink}
                    >
                      Generate Branded Report Link
                    </Button>
                    <p className="text-[7px] text-neutral-500 font-bold uppercase text-center tracking-wide leading-relaxed">
                      Generates a client-facing web page preloaded with these leak numbers, ready to share on social/email.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── Upgrade Stripe Modal Sandbox ─── */}
      {showStripeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="tactical-glass max-w-sm w-full p-6 border-[#00ffc8]/20 bg-[#0e1423] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] text-[#00ffc8] font-extrabold uppercase tracking-widest">License Center</span>
                <h4 className="text-xs font-black text-white uppercase mt-0.5">Upgrade License Tier</h4>
              </div>
              <button 
                onClick={() => setShowStripeModal(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="bg-black/45 border border-neutral-850 rounded p-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-white">
                <span>PitchRadar PRO License</span>
                <span className="text-[#39FF14]">$49/mo</span>
              </div>
              <p className="text-[8px] text-[#00ffc8] font-bold uppercase tracking-wider">
                ✓ Unlimited scans • ✓ Full diagnostics • ✓ Competitor audits • ✓ Video script scrolling
              </p>
            </div>

            {/* Fake credit card simulator */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[7px] text-neutral-500 font-bold uppercase">Mock Card Details</label>
                <input
                  type="text"
                  disabled
                  value="4242 4242 4242 4242 — sandbox"
                  className="bg-black border border-neutral-850 rounded px-2.5 py-2 text-[9px] text-neutral-500 font-bold"
                />
              </div>
              
              <Button
                variant="green"
                size="sm"
                className="w-full justify-center"
                onClick={handleUpgradeToPro}
              >
                Deploy License (Simulate Stripe Purchase)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
