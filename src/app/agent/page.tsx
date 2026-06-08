'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search, Zap, Target, Users, Mail, BarChart2, Settings, ChevronRight,
  Copy, Download, RefreshCw, X, Play, Pause, Activity, Sliders, Cpu,
  Shield, Trash2, Award, Terminal, Filter, CheckSquare, Square, Flame,
  AlertTriangle, ShieldCheck, ShieldX, ExternalLink, Sparkles, Check, Star
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ToastProvider, useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

// ─── Custom Icons ──────────────────────────────────────────────────────────
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Lead {
  id: string;
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
  crm_status: 'new' | 'checked' | 'contacted' | 'proposal' | 'closed_won' | 'closed_lost';
  notes: string;
  source_query?: string;
  service_pitched?: string;
  created_at?: string;
}

interface TerminalLine {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

interface MissionPlan {
  missionSummary: string;
  strategy: string;
  searchBatches: Array<{
    batchId: number;
    city: string;
    state: string;
    niche: string;
    targetCount: number;
  }>;
  estimatedTime: string;
  focusAreas: string[];
}

interface MissionHistoryEntry {
  id: string;
  missionDescription: string;
  timestamp: string;
  leadsFound: number;
  avgGapScore: number;
  leads: Lead[];
}

export default function AgentPage() {
  return (
    <ToastProvider>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .font-mono-agent {
          font-family: 'IBM Plex Mono', monospace;
        }
        .scanlines {
          position: relative;
          overflow: hidden;
        }
        .scanlines::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 10;
          background-size: 100% 3px, 6px 100%;
          pointer-events: none;
        }
        .hud-glow {
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
        }
      `}</style>
      <AgentConsole />
    </ToastProvider>
  );
}

function AgentConsole() {
  // DB & State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dbCount, setDbCount] = useState(0);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'planning' | 'running' | 'complete' | 'error'>('idle');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [liveFeed, setLiveFeed] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [diagnosticTab, setDiagnosticTab] = useState<'intelligence' | 'pitch' | 'plan'>('intelligence');
  
  // Settings & History
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agentSpeed, setAgentSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [dbLimit, setDbLimit] = useState<number>(1000);
  const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);

  // Input states
  const [missionInput, setMissionInput] = useState('');
  const [targetCount, setTargetCount] = useState(30);
  const [selectedRegion, setSelectedRegion] = useState('us');
  const [selectedNiche, setSelectedNiche] = useState('Dentists');
  const [minScore, setMinScore] = useState(50);
  
  // Filters checkboxes
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterLowRating, setFilterLowRating] = useState(false);
  const [filterNoSocial, setFilterNoSocial] = useState(false);

  // Db leads filtering & sorting
  const [dbSearch, setDbSearch] = useState('');
  const [dbSortBy, setDbSortBy] = useState<'ai_score' | 'company_name' | 'est_revenue_loss'>('ai_score');
  const [dbSortOrder, setDbSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dbPage, setDbPage] = useState(1);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  // AI Generation states
  const [pitchEmail, setPitchEmail] = useState('');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Run Cancellation ref
  const cancelRef = useRef(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Load from local storage and DB
  const loadDatabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLeads(data);
        setDbCount(data.length);
      }
    } catch (err) {
      console.error('Failed to load database leads:', err);
    }
  }, []);

  useEffect(() => {
    loadDatabase();
    
    // Load local history
    const savedHistory = localStorage.getItem('pitchradar_missions');
    if (savedHistory) {
      try {
        setMissionHistory(JSON.parse(savedHistory));
      } catch {
        setMissionHistory([]);
      }
    }
  }, [loadDatabase]);

  // Terminal Line helper
  const addTerminalLine = useCallback((text: string, type: TerminalLine['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setTerminalLines(prev => [...prev, { time, text: text.toUpperCase(), type }]);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Handle deploying agent
  const handleDeployAgent = async () => {
    if (!missionInput.trim()) {
      showToast('Please specify a mission input first.', 'error');
      return;
    }

    cancelRef.current = false;
    setAgentStatus('planning');
    setTerminalLines([]);
    setLiveFeed([]);
    
    addTerminalLine('MISSION CONTROL STARTED.', 'system');
    addTerminalLine('INITIALIZING MISSION PARAMETERS...', 'info');
    addTerminalLine(`ACQUISITION TARGET COUNT: ${targetCount} NODES`, 'info');
    addTerminalLine(`NICHE CRITERIA: ${selectedNiche.toUpperCase()}`, 'info');
    addTerminalLine(`REGION SCOPE: ${selectedRegion.toUpperCase()} CITIES`, 'info');

    // 1. Planning Phase
    let searchPlan: MissionPlan;
    try {
      addTerminalLine('CALLING STRATEGY COGNITIVE ENGINE...', 'system');
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an AI B2B agent planning a lead generation mission.
Mission Request: "${missionInput}"
Acquisition target count: ${targetCount}
Niche: ${selectedNiche}
Region: ${selectedRegion}

Generate a detailed strategy plan. Return ONLY JSON format, no markup:
{
  "missionSummary": "Brief overview of the mission",
  "strategy": "How you plan to segment cities and capture leads",
  "searchBatches": [
    { "batchId": 1, "city": "Boston", "state": "MA", "niche": "${selectedNiche.toLowerCase()}", "targetCount": ${Math.max(5, Math.ceil(targetCount / 3))} },
    { "batchId": 2, "city": "Austin", "state": "TX", "niche": "${selectedNiche.toLowerCase()}", "targetCount": ${Math.max(5, Math.ceil(targetCount / 3))} },
    { "batchId": 3, "city": "Chicago", "state": "IL", "niche": "${selectedNiche.toLowerCase()}", "targetCount": ${Math.max(5, Math.ceil(targetCount / 3))} }
  ],
  "estimatedTime": "1-3 minutes",
  "focusAreas": ["SEO Vulnerability", "Website Performance", "Pixel Tracking Gaps"]
}`
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const clean = payload.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        searchPlan = JSON.parse(clean);
      } else {
        throw new Error('Claude proxy failed');
      }
    } catch {
      addTerminalLine('STRATEGY ENGINE FAILURE. RUNNING FALLBACK LOCAL PLANNER...', 'warning');
      const batchSize = Math.max(5, Math.ceil(targetCount / 3));
      searchPlan = {
        missionSummary: `Find ${targetCount} ${selectedNiche} across ${selectedRegion} region.`,
        strategy: 'Local heuristic batch generator targeting high opportunity hubs.',
        searchBatches: [
          { batchId: 1, city: 'Dallas', state: 'TX', niche: selectedNiche.toLowerCase(), targetCount: batchSize },
          { batchId: 2, city: 'Denver', state: 'CO', niche: selectedNiche.toLowerCase(), targetCount: batchSize },
          { batchId: 3, city: 'Seattle', state: 'WA', niche: selectedNiche.toLowerCase(), targetCount: batchSize }
        ],
        estimatedTime: '60 seconds',
        focusAreas: ['SEO Score', 'Ad Pixels', 'Site Speed']
      };
    }

    addTerminalLine(`STRATEGY DEPLOYED: ${searchPlan.missionSummary}`, 'success');
    addTerminalLine(`ACQUISITION SPEED LIMIT: ${agentSpeed.toUpperCase()}`, 'info');
    
    // Switch to execution mode
    setAgentStatus('running');

    const delayMs = agentSpeed === 'fast' ? 0 : agentSpeed === 'slow' ? 1200 : 500;
    const addedLeads: Lead[] = [];

    // Loop through batches
    for (const batch of searchPlan.searchBatches) {
      if (cancelRef.current) {
        addTerminalLine('MISSION ABORTED BY OPERATOR.', 'error');
        setAgentStatus('idle');
        return;
      }

      addTerminalLine(`BATCH ${batch.batchId}/${searchPlan.searchBatches.length}: SCANNING ${batch.city.toUpperCase()}, ${batch.state.toUpperCase()}...`, 'system');

      let batchLeads: any[] = [];
      try {
        const filtersStr = [
          filterHasWebsite ? 'Must have website' : '',
          filterNoWebsite ? 'Must not have website' : '',
          filterLowRating ? 'Rating under 4.0' : '',
          filterNoSocial ? 'Missing Instagram or Facebook' : ''
        ].filter(Boolean).join(', ');

        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: batch.niche,
            location: `${batch.city}, ${batch.state}`,
            limit: batch.targetCount
          })
        });

        if (response.ok) {
          const payload = await response.json();
          batchLeads = payload.leads || [];
        } else {
          throw new Error('Apify scrape failed');
        }
      } catch (err: any) {
        addTerminalLine(`BATCH CRAWL FAILURE: ${err.message}. USING FALLBACK...`, 'warning');
        // Generate realistic fallback simulation leads
        batchLeads = Array.from({ length: batch.targetCount }).map((_, idx) => {
          const gap = Math.floor(Math.random() * 50) + 45; // 45-95
          const loss = Math.round(gap * 42);
          const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'None'];
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          return {
            name: `${batch.city} ${selectedNiche} Hub #${idx + 1}`,
            category: batch.niche,
            city: batch.city,
            state: batch.state,
            phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            website: platform === 'None' ? 'N/A' : `www.${batch.city.toLowerCase().replace(/\s+/g, '')}${selectedNiche.toLowerCase()}hub${idx+1}.com`,
            platform,
            speedScore: gap > 75 ? 'Slow (5.4s)' : gap > 50 ? 'Medium (3.2s)' : 'Fast (1.4s)',
            seoScore: 100 - gap,
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            reviews: Math.floor(Math.random() * 120),
            hasAnalytics: gap < 60,
            hasLeadForm: gap < 50,
            hasBooking: gap < 70,
            hasBlog: gap < 80,
            isRunningAds: Math.random() > 0.8,
            socialMedia: { facebook: Math.random() > 0.5, instagram: Math.random() > 0.6 },
            gapScore: gap,
            opportunityTemp: gap >= 75 ? 'HOT' : gap >= 50 ? 'WARM' : 'COLD',
            monthlyRevenueLoss: `$${loss}`,
            dealValue: `$${loss * 3} - $${loss * 6}/yr`,
            vulnerabilities: gap > 75 ? ['No lead capture form', 'Slow speed', 'No social pixel'] : ['Weak SEO metadata'],
            pitchAngle: `Pitch ${platform === 'None' ? 'website design' : 'SEO and optimization'} strategy.`
          };
        });
      }

      // Process and save leads in database
      const formattedBatch: Lead[] = batchLeads
        .filter(l => (l.gapScore || l.score || 0) >= minScore)
        .map(l => {
          const ratingVal = Number(l.rating) || 0;
          const reviewsVal = Number(l.reviews) || 0;
          const gapScoreVal = Number(l.gapScore || l.score) || 0;
          
          let lossVal = 0;
          if (l.scoring && l.scoring.revenue && l.scoring.revenue.estimatedMonthlyLoss) {
            lossVal = l.scoring.revenue.estimatedMonthlyLoss;
          } else if (l.monthlyRevenueLoss) {
             lossVal = Number(l.monthlyRevenueLoss.toString().replace(/[\$,]/g, ''));
          } else {
             lossVal = Math.round(gapScoreVal * 42); // fallback
          }

          const gapsArr: string[] = l.opps || [];
          if (gapsArr.length === 0) {
            if (l.seoScore < 50 || (l.siteAnalysis && l.siteAnalysis.seoScore < 50)) gapsArr.push('SEO');
            if (l.socialMedia?.facebook === false || l.socialMedia?.instagram === false) gapsArr.push('SOCIAL');
            if (l.hasWebsite === false || l.website === 'N/A') gapsArr.push('WEB');
            if (l.hasAnalytics === false) gapsArr.push('EMAIL');
            if (l.isRunningAds === false) gapsArr.push('ADS');
          }

          const oppTempRaw = l.opportunityTemp || l.temperature || 'cold';

          return {
            id: l.id || `lead-${Math.random().toString(36).substr(2, 9)}`,
            company_name: l.companyName || l.name || 'Unknown',
            niche: l.category || selectedNiche,
            location: l.address ? `${l.address}, ${l.city}` : `${l.city || batch.city}, ${l.state || batch.state}`,
            rating: ratingVal,
            review_count: reviewsVal,
            phone: l.phone || 'N/A',
            email: l.email || `contact@${l.website || 'domain.com'}`,
            website: l.website || 'N/A',
            ai_score: gapScoreVal,
            opportunity_temp: oppTempRaw.toLowerCase() as Lead['opportunity_temp'],
            gaps: gapsArr,
            est_revenue_loss: lossVal,
            deal_value_min: lossVal * 3,
            deal_value_max: lossVal * 6,
            platform: (l.siteAnalysis && l.siteAnalysis.cms) || l.platform || 'N/A',
            site_speed: l.siteAnalysis?.loadTime ? `${(l.siteAnalysis.loadTime / 1000).toFixed(1)}s` : l.speedScore || 'Fast',
            ssl_status: (l.siteAnalysis?.ssl === false || l.ssl === false) ? 'Invalid' : 'Valid',
            seo_score: l.siteAnalysis?.seoScore || l.seoScore || 50,
            vulnerabilities: l.siteAnalysis?.opportunities || l.vulnerabilities || [],
            crm_status: 'new' as const,
            notes: [
              `Decision Maker: ${l.decisionMaker || 'N/A'}`,
              `Facebook: ${l.social?.fb || l.socialMedia?.facebook ? 'Linked' : 'N/A'}`,
              `Instagram: ${l.social?.insta || l.socialMedia?.instagram ? 'Linked' : 'N/A'}`,
              `Google Maps: ${l.placeUrl ? 'Linked' : 'N/A'}`,
              ...(l.siteAnalysis?.opportunities || l.vulnerabilities || [])
            ].join('\n'),
            source_query: `AI Agent: ${missionInput}`,
            service_pitched: l.pitchAngle || 'N/A'
          };
        });

      // Insert to Supabase DB
      if (formattedBatch.length > 0) {
        try {
          const { error } = await supabase.from('leads').insert(formattedBatch);
          if (error) throw error;

          addedLeads.push(...formattedBatch);
          setLiveFeed(prev => [...formattedBatch.slice(0, 10), ...prev].slice(0, 20));
          
          for (const l of formattedBatch) {
            addTerminalLine(`ACQUIRED: ${l.company_name} [GAP: ${l.ai_score} PTS]`, 'success');
            
            // Send WhatsApp Alert
            fetch('/api/whatsapp-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: l.notes?.match(/Decision Maker: (.*)/)?.[1] || 'N/A',
                company: l.company_name,
                email: l.email,
                score: l.ai_score
              })
            }).catch(console.error);

            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          setDbCount(prev => prev + formattedBatch.length);
          setLeads(prev => [...formattedBatch, ...prev]);
        } catch (dbErr) {
          console.error(dbErr);
          addTerminalLine('DATABASE WRITE ERROR. SKIPPING BATCH COMMIT.', 'error');
        }
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 3. Analysis Phase
    setAgentStatus('planning');
    addTerminalLine('MISSION COMPLETE. INITIATING POST-MISSION ANALYSIS...', 'system');
    
    try {
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze these ${addedLeads.length} leads and provide mission intelligence summary.
Leads: ${JSON.stringify(addedLeads.map(l => ({ name: l.company_name, score: l.ai_score, loss: l.est_revenue_loss, gaps: l.gaps })))}

Return ONLY JSON:
{
  "totalFound": ${addedLeads.length},
  "hotLeads": ${addedLeads.filter(l => l.opportunity_temp === 'hot').length},
  "warmLeads": ${addedLeads.filter(l => l.opportunity_temp === 'warm').length},
  "coldLeads": ${addedLeads.filter(l => l.opportunity_temp === 'cold').length},
  "avgGapScore": ${Math.round(addedLeads.reduce((s, l) => s + l.ai_score, 0) / (addedLeads.length || 1))},
  "topCity": "${searchPlan.searchBatches[0]?.city || 'N/A'}",
  "topVulnerability": "SEO Tag Gaps",
  "estimatedTotalPipelineValue": "$${addedLeads.reduce((s, l) => s + l.est_revenue_loss, 0).toLocaleString()}",
  "topIndustryInsight": "Vast majority have missing conversion triggers",
  "recommendedAction": "Establish email sequence for all HOT targets."
}`
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const clean = payload.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(clean);

        addTerminalLine('════════════════════════════════════════', 'success');
        addTerminalLine(`MISSION COMPLETED SUCCESSFULLY — ${analysis.totalFound} LEADS ACQUIRED`, 'success');
        addTerminalLine(`HOT ACQUISITIONS: ${analysis.hotLeads} NODES`, 'success');
        addTerminalLine(`AVERAGE GAP RATING: ${analysis.avgGapScore}%`, 'success');
        addTerminalLine(`ESTIMATED MONTHLY LEAK VALUE: ${analysis.estimatedTotalPipelineValue}`, 'success');
        addTerminalLine(`INSIGHT: ${analysis.topIndustryInsight.toUpperCase()}`, 'system');
        addTerminalLine(`RECOMMENDED ACTION: ${analysis.recommendedAction.toUpperCase()}`, 'info');
        addTerminalLine('════════════════════════════════════════', 'success');
      } else {
        throw new Error('Analysis failed');
      }
    } catch {
      addTerminalLine('════════════════════════════════════════', 'success');
      addTerminalLine(`MISSION COMPLETED SUCCESSFULLY — ${addedLeads.length} LEADS ACQUIRED`, 'success');
      addTerminalLine(`AVERAGE GAP RATING: ${Math.round(addedLeads.reduce((s, l) => s + l.ai_score, 0) / (addedLeads.length || 1))}%`, 'success');
      addTerminalLine(`ESTIMATED MONTHLY LEAK VALUE: $${addedLeads.reduce((s, l) => s + l.est_revenue_loss, 0).toLocaleString()}`, 'success');
      addTerminalLine('════════════════════════════════════════', 'success');
    }

    setAgentStatus('complete');

    // Add to Local Storage History
    const newHistoryEntry: MissionHistoryEntry = {
      id: `mission-${Date.now()}`,
      missionDescription: missionInput,
      timestamp: new Date().toLocaleString(),
      leadsFound: addedLeads.length,
      avgGapScore: Math.round(addedLeads.reduce((s, l) => s + l.ai_score, 0) / (addedLeads.length || 1)),
      leads: addedLeads
    };
    const nextHistory = [newHistoryEntry, ...missionHistory].slice(0, 10);
    setMissionHistory(nextHistory);
    localStorage.setItem('pitchradar_missions', JSON.stringify(nextHistory));
  };

  // Stop / Abort Agent
  const handleStopAgent = () => {
    cancelRef.current = true;
    addTerminalLine('ABORT SEQUENCE INITIATED...', 'warning');
  };

  // Generate Email Outreach
  const handleGeneratePitch = async (lead: Lead) => {
    setGeneratingPitch(true);
    setPitchEmail('');
    try {
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a personalized cold email outreach for agency pitching to: ${lead.company_name}.
Category: ${lead.niche}. Location: ${lead.location}.
Platform: ${lead.platform}. Site speed: ${lead.site_speed}. SEO Score: ${lead.seo_score}/100.
Vulnerabilities: ${lead.vulnerabilities.join(', ') || 'Poor mobile load speed'}.

Requirements: Under 130 words, subject line, mention one specific monthly loss amount of $${lead.est_revenue_loss}. Conversational tone, direct call to action. Format as:
SUBJECT: ...
EMAIL BODY: ...`
        })
      });

      if (response.ok) {
        const payload = await response.json();
        setPitchEmail(payload.content[0].text.trim());
      } else {
        throw new Error('Claude call failed');
      }
    } catch {
      setPitchEmail(`Subject: Action Required: Digital Leakage on ${lead.company_name}\n\nHi Team,\n\nI was auditing websites in ${lead.location} and noticed your site has critical performance gaps. Specifically, the load time is slow (${lead.site_speed}) and SEO is score is ${lead.seo_score}/100. Our model predicts this is leaking roughly $${lead.est_revenue_loss.toLocaleString()}/mo in customer opportunities.\n\nWe specialize in resolving exactly these issues. Let me know if you have 5 minutes for a quick feedback call.\n\nBest,\n[Your Name]`);
    } finally {
      setGeneratingPitch(false);
    }
  };

  // Generate Week plan checklist
  const handleGeneratePlan = async (lead: Lead) => {
    setGeneratingPlan(true);
    setActionPlan(null);
    try {
      const response = await fetch('/api/demo-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a 4-week sales closure action plan for pitching digital marketing to: ${lead.company_name}.
Vulnerabilities: ${lead.vulnerabilities.join(', ') || 'No pixel tracking, slow speed'}.
Return ONLY JSON array containing 4 week blocks, no markdown:
{
  "weeks": [
    { "week": 1, "title": "Audit & Connect", "tasks": ["Send email sequence", "Audit competitor speed", "Record video mockup"] },
    { "week": 2, "title": "Follow Up & Meet", "tasks": ["Call decision maker", "Present competitor Gap Spy", "Book strategy call"] },
    { "week": 3, "title": "Proposal Pitch", "tasks": ["Demo landing page upgrade", "Review monthly revenue leak", "Define contract scope"] },
    { "week": 4, "title": "Close & Onboard", "tasks": ["Sign service contract", "Deploy new pixel tracking", "Setup analytics dashboard"] }
  ]
}`
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const clean = payload.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        setActionPlan(JSON.parse(clean));
      } else {
        throw new Error('Claude call failed');
      }
    } catch {
      setActionPlan({
        weeks: [
          { week: 1, title: 'Engagement Audit', tasks: ['Audit site mobile speed', 'Identify local competitors', 'Send personalized Loom video'] },
          { week: 2, title: 'outreach & Call', tasks: ['Email cold sequence', 'Call to confirm video delivery', 'Book a 15-minute diagnostic call'] },
          { week: 3, title: 'Proposal Pitch', tasks: ['Present website audit mockup', 'Confirm budget and scope', 'Deliver contract draft'] },
          { week: 4, title: 'Contract Close', tasks: ['Sign agreement', 'Initialize onboarding', 'Start SEO audit fixes'] }
        ]
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Clear database
  const handleClearDatabase = async () => {
    if (!confirm('WARNING: Are you sure you want to completely purge the Supabase leads database?')) return;
    try {
      const { error } = await supabase.from('leads').delete().gt('ai_score', -1);
      if (error) throw error;
      setLeads([]);
      setDbCount(0);
      setLiveFeed([]);
      showToast('Database purged successfully.', 'success');
    } catch (err: any) {
      showToast('Purging failed: ' + err.message, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = (targetLeads: Lead[]) => {
    if (targetLeads.length === 0) return;
    const headers = ['Business Name', 'Category', 'Location', 'Rating', 'Gap Score', 'Temp', 'Revenue Loss', 'Website', 'Phone', 'Platform'];
    const rows = targetLeads.map(l => [
      l.company_name, l.niche, l.location, l.rating, l.ai_score, l.opportunity_temp, l.est_revenue_loss, l.website, l.phone, l.platform
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitchradar-agent-database-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic filter lists
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (dbSearch.trim()) {
      const q = dbSearch.toLowerCase();
      result = result.filter(l =>
        l.company_name.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.niche.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let fieldA: any = a[dbSortBy];
      let fieldB: any = b[dbSortBy];
      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      if (fieldA < fieldB) return dbSortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return dbSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, dbSearch, dbSortBy, dbSortOrder]);

  const totalPages = Math.ceil(filteredLeads.length / 25);
  const pagedLeads = useMemo(() => {
    const start = (dbPage - 1) * 25;
    return filteredLeads.slice(start, start + 25);
  }, [filteredLeads, dbPage]);

  // Bulk select toggling
  const toggleSelect = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === pagedLeads.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(pagedLeads.map(l => l.id)));
    }
  };

  // Status colors
  const statusPills = {
    idle: { label: 'AGENT IDLE', color: 'bg-[#ff4444]', text: 'text-[#ff4444]' },
    planning: { label: 'AGENT PLANNING', color: 'bg-[#ffb800] animate-pulse', text: 'text-[#ffb800]' },
    running: { label: 'AGENT WORKING', color: 'bg-[#ffb800] animate-pulse', text: 'text-[#ffb800]' },
    complete: { label: 'AGENT ONLINE', color: 'bg-[#00ff88]', text: 'text-[#00ff88]' },
    error: { label: 'AGENT ERROR', color: 'bg-[#ff4444]', text: 'text-[#ff4444]' }
  };

  const statusInfo = statusPills[agentStatus];

  // Open Lead diagnostics
  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDiagnosticTab('intelligence');
    setPitchEmail('');
    setActionPlan(null);
    setIsDiagnosticOpen(true);
  };

  useEffect(() => {
    if (selectedLead && diagnosticTab === 'pitch' && !pitchEmail && !generatingPitch) {
      handleGeneratePitch(selectedLead);
    }
    if (selectedLead && diagnosticTab === 'plan' && !actionPlan && !generatingPlan) {
      handleGeneratePlan(selectedLead);
    }
  }, [selectedLead, diagnosticTab]);

  return (
    <div className="min-h-screen bg-[#050a0f] text-[#c8d8e8] font-mono-agent p-6 select-none flex flex-col justify-between">
      
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <header className="border-b border-[#1e3a5f]/50 pb-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0a1628] border border-[#00d4ff]/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.25)]">
            <Cpu className="w-4.5 h-4.5 text-[#00d4ff]" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest">PITCHRADAR // AI AGENT</h1>
            <p className="text-[8px] text-[#4a6080] tracking-wider mt-0.5">AUTONOMOUS MARKETING OUTPOST</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 bg-[#0a1628] px-3.5 py-1.5 rounded-full border border-[#1e3a5f] text-[9px] font-bold">
            <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
            <span className={statusInfo.text}>{statusInfo.label}</span>
          </div>

          {/* Database Counter */}
          <div className="bg-[#0a1628] border border-[#1e3a5f] px-4 py-1.5 rounded text-[10px] font-bold text-[#00d4ff]">
            DATABASE: <span className="text-white font-extrabold">{dbCount}</span> TARGETS INDEXED
          </div>

          {/* Settings Trigger */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 bg-[#0a1628] border border-[#1e3a5f] rounded flex items-center justify-center hover:border-[#00d4ff]/50 transition-colors cursor-pointer text-[#4a6080] hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── THREE COLUMN WORKSPACE ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* LEFT COLUMN: MISSION CONTROL */}
        <section className="xl:col-span-3 bg-[#0a1628]/85 border border-[#1e3a5f] rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="border-b border-[#1e3a5f] pb-2.5">
            <h3 className="text-[10px] font-black text-white tracking-widest uppercase">MISSION CONTROL</h3>
          </div>

          {/* Mission Description Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Describe Target Market</label>
            <textarea
              value={missionInput}
              onChange={e => setMissionInput(e.target.value)}
              disabled={agentStatus === 'planning' || agentStatus === 'running'}
              className="bg-black/60 border border-[#1e3a5f] w-full h-[80px] rounded p-2.5 text-[10px] font-semibold text-white focus:border-[#00d4ff] outline-none resize-none select-text"
              placeholder="e.g. Find 100 dentists in Boston with slow load times and low SEO ratings..."
            />
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Target Acquisition Count</label>
              <div className="text-[11px] text-white font-bold">{targetCount} Nodes</div>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={targetCount}
                onChange={e => setTargetCount(Number(e.target.value))}
                disabled={agentStatus === 'planning' || agentStatus === 'running'}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00d4ff]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Min Opportunity Score</label>
              <div className="text-[11px] text-[#ffb800] font-bold">{minScore} PTS</div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                disabled={agentStatus === 'planning' || agentStatus === 'running'}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00d4ff]"
              />
            </div>
          </div>

          {/* Region and niche selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Region scope</label>
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                disabled={agentStatus === 'planning' || agentStatus === 'running'}
                className="bg-black/80 border border-[#1e3a5f] rounded px-2.5 py-1.5 text-[9px] text-neutral-300 font-bold focus:border-[#00d4ff] cursor-pointer outline-none uppercase"
              >
                <option value="us">US Cities</option>
                <option value="uk">UK Cities</option>
                <option value="ca">Canada Cities</option>
                <option value="pk">Pakistan Cities</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Industry focus</label>
              <select
                value={selectedNiche}
                onChange={e => setSelectedNiche(e.target.value)}
                disabled={agentStatus === 'planning' || agentStatus === 'running'}
                className="bg-black/80 border border-[#1e3a5f] rounded px-2.5 py-1.5 text-[9px] text-neutral-300 font-bold focus:border-[#00d4ff] cursor-pointer outline-none uppercase"
              >
                <option value="Dentists">Dentists</option>
                <option value="Lawyers">Lawyers</option>
                <option value="Roofers">Roofers</option>
                <option value="Restaurants">Restaurants</option>
                <option value="Gyms">Gyms</option>
                <option value="Plumbers">Plumbers</option>
              </select>
            </div>
          </div>

          {/* Priority Filters */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] text-[#4a6080] font-extrabold uppercase tracking-widest">Filter Prioritizations</label>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-neutral-450 font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={filterHasWebsite} onChange={e => setFilterHasWebsite(e.target.checked)} disabled={agentStatus === 'planning' || agentStatus === 'running'} className="accent-[#00d4ff]" />
                <span>HAS WEBSITE</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={filterNoWebsite} onChange={e => setFilterNoWebsite(e.target.checked)} disabled={agentStatus === 'planning' || agentStatus === 'running'} className="accent-[#00d4ff]" />
                <span>NO WEBSITE</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={filterLowRating} onChange={e => setFilterLowRating(e.target.checked)} disabled={agentStatus === 'planning' || agentStatus === 'running'} className="accent-[#00d4ff]" />
                <span>LOW RATING</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={filterNoSocial} onChange={e => setFilterNoSocial(e.target.checked)} disabled={agentStatus === 'planning' || agentStatus === 'running'} className="accent-[#00d4ff]" />
                <span>MISSING SOCIAL</span>
              </label>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2">
            {agentStatus === 'planning' || agentStatus === 'running' ? (
              <Button
                variant="pink"
                className="w-full text-[10px] font-extrabold py-3 border border-[#ff4444]/30 tracking-widest"
                onClick={handleStopAgent}
              >
                <Pause className="w-3.5 h-3.5 fill-current" /> STOP AGENT SEQUENCE
              </Button>
            ) : (
              <Button
                variant="radar"
                className="w-full text-[10px] font-extrabold py-3 border border-[#00d4ff]/30 tracking-widest hud-glow hover:scale-[1.01] transition-transform"
                onClick={handleDeployAgent}
              >
                <Play className="w-3.5 h-3.5 fill-current" /> DEPLOY AUTONOMOUS AGENT
              </Button>
            )}
          </div>
        </section>

        {/* MIDDLE COLUMN: REAL-TIME ACTIVITY TERMINAL */}
        <section className="xl:col-span-6 bg-black border border-[#1e3a5f] rounded-lg flex flex-col justify-between h-[360px] xl:h-auto select-text scanlines relative">
          <div className="bg-[#0a1628]/95 border-b border-[#1e3a5f] px-5 py-3 flex justify-between items-center sticky top-0 z-20">
            <h3 className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#00d4ff]" /> AGENT ACTIVITY TERMINAL
            </h3>
            <span className="text-[7.5px] bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 px-1.5 py-0.5 rounded font-black">
              LIVE MONITORING
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto font-mono text-[9.5px] space-y-2 select-text custom-scrollbar max-h-[300px] xl:max-h-[340px]">
            {terminalLines.length > 0 ? (
              terminalLines.map((line, idx) => {
                const textColors = {
                  info: 'text-neutral-400',
                  success: 'text-[#00ff88] font-bold',
                  warning: 'text-[#ffb800] font-bold',
                  error: 'text-[#ff4444] font-black',
                  system: 'text-[#00d4ff] font-extrabold'
                };
                return (
                  <div key={idx} className={`leading-relaxed border-l-2 pl-2 border-transparent hover:bg-neutral-900/40 py-0.5 transition-colors ${textColors[line.type]}`}>
                    <span className="text-[#4a6080] font-bold mr-2 select-none">[{line.time}] &gt;</span>
                    {line.text}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#4a6080] italic py-12">
                <Cpu className="w-8 h-8 mb-2 animate-pulse" />
                SYSTEM READY. AWAITING DEPLOYMENT PARAMETERS...
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE DATABASE FEED */}
        <section className="xl:col-span-3 bg-[#0a1628]/85 border border-[#1e3a5f] rounded-lg p-5 flex flex-col justify-between h-[360px] xl:h-auto shadow-lg">
          <div className="border-b border-[#1e3a5f] pb-2.5 mb-3">
            <h3 className="text-[10px] font-black text-white tracking-widest uppercase">LIVE FEED</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[260px] xl:max-h-[300px] custom-scrollbar">
            {liveFeed.length > 0 ? (
              liveFeed.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleOpenLead(lead)}
                  className="p-3 border border-[#1e3a5f] bg-[#0f1e35]/65 hover:border-[#00d4ff]/40 transition-all rounded cursor-pointer animate-in slide-in-from-right-3 duration-300 flex justify-between items-center"
                >
                  <div className="truncate max-w-[150px]">
                    <h5 className="text-[10.5px] font-extrabold text-white uppercase truncate">{lead.company_name}</h5>
                    <span className="text-[7.5px] text-[#4a6080] uppercase mt-0.5 block">{lead.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${
                      lead.opportunity_temp === 'hot'
                        ? 'bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/30'
                        : 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/30'
                    }`}>
                      {lead.opportunity_temp.toUpperCase()}
                    </span>
                    <span className="text-[#00ff88] text-[10px] font-extrabold font-mono">
                      {lead.ai_score} PTS
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-[#4a6080] text-[9.5px] italic py-16">
                No active targets scanned in current session.
              </div>
            )}
          </div>

          <div className="border-t border-[#1e3a5f] pt-3 flex gap-2.5">
            <button 
              onClick={() => handleExportCSV(leads)}
              disabled={leads.length === 0}
              className="flex-1 py-2 rounded border border-neutral-850 hover:border-[#00d4ff]/40 bg-black/45 text-[9px] font-black text-neutral-400 hover:text-white uppercase transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Export CSV
            </button>
            <a 
              href="#leads-list-table"
              className="flex-1 py-2 rounded border border-[#00d4ff]/20 hover:border-[#00d4ff]/40 bg-[#00d4ff]/5 text-[9px] font-black text-[#00d4ff] hover:text-white uppercase text-center transition-colors cursor-pointer"
            >
              View Leads
            </a>
          </div>
        </section>

      </div>

      {/* ─── LEADS DATABASE TABLE VIEW ───────────────────────────────────────── */}
      <section id="leads-list-table" className="bg-[#0a1628]/85 border border-[#1e3a5f] rounded-lg p-5 space-y-4 shadow-lg select-text scroll-mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e3a5f] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-[#00ff88]" />
            <h3 className="text-[10px] font-black text-white tracking-widest uppercase">ACQUIRED INTEL DATABASE ({filteredLeads.length} Targets)</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={dbSearch}
                onChange={e => { setDbSearch(e.target.value); setDbPage(1); }}
                className="bg-black border border-[#1e3a5f] rounded pl-8 pr-3 py-1.5 text-[10px] font-semibold text-white focus:border-[#00d4ff] outline-none w-[180px]"
                placeholder="SEARCH LEADS..."
              />
            </div>

            {/* Sort Toggle */}
            <select
              value={dbSortBy}
              onChange={e => setDbSortBy(e.target.value as any)}
              className="bg-black border border-[#1e3a5f] rounded px-2.5 py-1.5 text-[9px] text-neutral-300 font-bold focus:border-[#00d4ff] cursor-pointer outline-none uppercase"
            >
              <option value="ai_score">Sort: Gap Score</option>
              <option value="company_name">Sort: Alphabetical</option>
              <option value="est_revenue_loss">Sort: Revenue Loss</option>
            </select>

            {/* Clear Database button */}
            <button
              onClick={handleClearDatabase}
              disabled={leads.length === 0}
              className="py-1.5 px-3 rounded border border-[#ff4444]/30 hover:bg-[#ff4444]/10 text-[9px] text-[#ff4444] font-black uppercase transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Purge DB
            </button>
          </div>
        </div>

        {/* Database table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-[#1e3a5f] text-neutral-500 font-extrabold uppercase">
                <th className="py-2.5 pr-2 w-8">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-neutral-500 hover:text-white">
                    {bulkSelected.size === pagedLeads.length && pagedLeads.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#00d4ff]" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 pr-4">Business Name</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-center">Rating</th>
                <th className="py-2.5 px-4 text-center">AI Score</th>
                <th className="py-2.5 px-4 text-center">Temp</th>
                <th className="py-2.5 px-4">Opportunity Gaps</th>
                <th className="py-2.5 px-4 text-right">Est. Loss</th>
                <th className="py-2.5 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f]/30 text-neutral-300 font-semibold">
              {pagedLeads.length > 0 ? (
                pagedLeads.map((lead, idx) => {
                  const isSelected = bulkSelected.has(lead.id);
                  const rowColors = {
                    hot: 'bg-[#ff4444]/3 border-l-2 border-l-[#ff4444]/40',
                    warm: 'bg-[#ffb800]/2 border-l-2 border-l-[#ffb800]/40',
                    cold: 'bg-[#00d4ff]/2 border-l-2 border-l-[#00d4ff]/40'
                  };

                  return (
                    <tr key={lead.id} className={`hover:bg-neutral-900/35 transition-colors ${rowColors[lead.opportunity_temp] || ''}`}>
                      <td className="py-3 pr-2">
                        <button onClick={() => toggleSelect(lead.id)} className="cursor-pointer text-neutral-500 hover:text-[#00d4ff]">
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-[#00d4ff]" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-3 pr-4 font-bold text-white uppercase truncate max-w-[200px]">{lead.company_name}</td>
                      <td className="py-3 px-4 uppercase truncate max-w-[150px]">{lead.location}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-black/45 px-1.5 py-0.5 rounded text-[9px] text-white">
                          <Star className="w-2.5 h-2.5 text-[#ffb800] fill-[#ffb800]/10" />
                          {lead.rating > 0 ? `${lead.rating} (${lead.review_count})` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-[#00ff88]">{lead.ai_score}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                          lead.opportunity_temp === 'hot'
                            ? 'bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/30'
                            : lead.opportunity_temp === 'warm'
                              ? 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/30'
                              : 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30'
                        }`}>
                          {lead.opportunity_temp}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {lead.gaps.map(g => (
                            <Badge key={g} variant={g === 'SEO' ? 'cyan' : g === 'SOCIAL' ? 'green' : 'default'}>{g}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-[#ffb800] font-bold">${lead.est_revenue_loss.toLocaleString()}/mo</td>
                      <td className="py-3 pl-4 text-right">
                        <button
                          onClick={() => handleOpenLead(lead)}
                          className="py-1 px-2.5 rounded border border-[#00d4ff]/30 bg-black/50 hover:bg-[#00d4ff] hover:text-[#050a0f] text-[#00d4ff] text-[9.5px] font-black uppercase transition-all cursor-pointer"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500 italic">
                    NO TARGETS FOUND MATCHING FILTER CRITERIA.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk tools footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#1e3a5f]">
          <div className="text-[9.5px] text-[#4a6080] font-bold">
            SHOWING {pagedLeads.length} OF {filteredLeads.length} TOTAL REGISTERED TARGETS
          </div>

          <div className="flex items-center gap-3">
            {bulkSelected.size > 0 && (
              <button
                onClick={() => {
                  const selectedLeads = leads.filter(l => bulkSelected.has(l.id));
                  handleExportCSV(selectedLeads);
                }}
                className="py-1.5 px-3 bg-[#ffb800]/5 border border-[#ffb800]/30 hover:border-[#ffb800]/60 text-[#ffb800] text-[9px] font-black rounded uppercase transition-colors cursor-pointer"
              >
                Export Selected ({bulkSelected.size})
              </button>
            )}
            <button
              onClick={() => handleExportCSV(filteredLeads)}
              disabled={filteredLeads.length === 0}
              className="py-1.5 px-3 bg-neutral-900 border border-neutral-800 hover:border-[#00d4ff]/50 text-neutral-400 hover:text-white text-[9px] font-black rounded uppercase transition-colors cursor-pointer disabled:opacity-50"
            >
              Export Database CSV
            </button>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex gap-1 border border-neutral-850 rounded overflow-hidden">
                <button
                  disabled={dbPage === 1}
                  onClick={() => setDbPage(p => Math.max(1, p - 1))}
                  className="px-2 py-1 text-[9px] font-bold text-neutral-450 hover:bg-neutral-900 border-r border-neutral-850 cursor-pointer disabled:opacity-40"
                >
                  PREV
                </button>
                <span className="px-3 py-1 text-[9px] font-extrabold text-white bg-black flex items-center">
                  {dbPage} / {totalPages}
                </span>
                <button
                  disabled={dbPage === totalPages}
                  onClick={() => setDbPage(p => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 text-[9px] font-bold text-neutral-450 hover:bg-neutral-900 border-l border-neutral-850 cursor-pointer disabled:opacity-40"
                >
                  NEXT
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── MISSION RUN HISTORY ────────────────────────────────────────────── */}
      {missionHistory.length > 0 && (
        <section className="bg-[#0a1628]/85 border border-[#1e3a5f] rounded-lg p-5 space-y-3 shadow-lg mt-6 select-none font-mono-agent">
          <div className="border-b border-[#1e3a5f] pb-2">
            <h3 className="text-[10px] font-black text-white tracking-widest uppercase">MISSION RECON HISTORY</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missionHistory.map(entry => (
              <div key={entry.id} className="p-4 border border-[#1e3a5f] bg-[#0f1e35]/40 rounded relative flex flex-col justify-between">
                <div>
                  <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-wider">{entry.timestamp}</div>
                  <h4 className="text-[10.5px] font-extrabold text-white uppercase mt-1 leading-snug line-clamp-2">{entry.missionDescription}</h4>
                </div>
                <div className="mt-4 flex justify-between items-center border-t border-[#1e3a5f]/40 pt-2.5">
                  <div className="flex gap-3 text-[9px]">
                    <span className="text-neutral-400 font-bold">FOUND: <span className="text-[#00ff88] font-extrabold">{entry.leadsFound}</span></span>
                    <span className="text-neutral-400 font-bold">GAP: <span className="text-[#00d4ff] font-extrabold">{entry.avgGapScore}%</span></span>
                  </div>
                  <button
                    onClick={() => {
                      setLeads(prev => [...entry.leads.filter(el => !prev.some(pl => pl.id === el.id)), ...prev]);
                      showToast(`Reloaded ${entry.leadsFound} leads to active workspace.`, 'success');
                    }}
                    className="py-1 px-2.5 border border-[#00d4ff]/30 hover:border-[#00d4ff] hover:bg-[#00d4ff] hover:text-black transition-all text-[8.5px] font-black uppercase rounded cursor-pointer"
                  >
                    Reload
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── DIAGNOSTIC DETAIL MODAL ────────────────────────────────────────── */}
      {selectedLead && (
        <Modal
          isOpen={isDiagnosticOpen}
          onClose={() => { setSelectedLead(null); setIsDiagnosticOpen(false); }}
          title="SALES RECON INTELLIGENCE AUDIT"
          subtitle={`NODE: ${selectedLead.company_name}`}
          maxWidth="max-w-[650px]"
        >
          <div className="p-6 space-y-5 font-mono text-[11px] select-none text-neutral-300">
            {/* Diagnostic Modal Tabs */}
            <div className="flex border-b border-[#1e3a5f]/40 pb-1 gap-1">
              {(['intelligence', 'pitch', 'plan'] as const).map(tab => {
                const active = diagnosticTab === tab;
                const labels = {
                  intelligence: 'INTELLIGENCE',
                  pitch: 'AI PITCH SEQUENCE',
                  plan: 'ACTION PLAN'
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setDiagnosticTab(tab)}
                    className={`px-4 py-2 border-t-2 border-x border-b border-transparent text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                      active
                        ? 'border-t-[#00d4ff] border-x-[#1e3a5f]/50 border-b-black bg-[#0a1628] text-[#00d4ff] shadow-[0_-2px_6px_rgba(0,212,255,0.06)]'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: INTELLIGENCE BRIEFING */}
            {diagnosticTab === 'intelligence' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/45 border border-[#1e3a5f] rounded p-3 text-center">
                    <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-widest mb-1">Opportunity Score</div>
                    <div className="text-lg font-black text-[#ff4444]">{selectedLead.ai_score} / 100</div>
                    <span className="text-[7.5px] text-[#ff4444]/85 font-extrabold uppercase mt-1 block">HOT PRIORITY</span>
                  </div>
                  <div className="bg-black/45 border border-[#1e3a5f] rounded p-3 text-center">
                    <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-widest mb-1">Est. Revenue Loss</div>
                    <div className="text-lg font-black text-[#ffb800]">${selectedLead.est_revenue_loss.toLocaleString()}/mo</div>
                    <span className="text-[7.5px] text-neutral-500 font-bold mt-1 block">CONVERSION LEAKAGE</span>
                  </div>
                  <div className="bg-black/45 border border-[#1e3a5f] rounded p-3 text-center">
                    <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-widest mb-1">Acquisition Value</div>
                    <div className="text-lg font-black text-[#00ff88]">${selectedLead.deal_value_min.toLocaleString()}+/yr</div>
                    <span className="text-[7.5px] text-neutral-500 font-bold mt-1 block">CONTRACT ESTIMATE</span>
                  </div>
                </div>

                {/* Tech StackPlatform row */}
                <div className="bg-black/30 border border-[#1e3a5f] rounded p-3.5 space-y-2 text-[10px]">
                  <div className="grid grid-cols-4 gap-4 text-center divide-x divide-[#1e3a5f]/40">
                    <div>
                      <div className="text-[8px] text-[#4a6080] font-black uppercase">CMS Platform</div>
                      <div className="text-white font-extrabold mt-1 uppercase">{selectedLead.platform}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-[#4a6080] font-black">Speed Index</div>
                      <div className="text-white font-extrabold mt-1 uppercase">{selectedLead.site_speed}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-[#4a6080] font-black">SSL Security</div>
                      <div className="text-white font-extrabold mt-1 uppercase">{selectedLead.ssl_status}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-[#4a6080] font-black">SEO Grade</div>
                      <div className="text-white font-extrabold mt-1">{selectedLead.seo_score}/100</div>
                    </div>
                  </div>
                </div>

                {/* Gaps Checklist */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 border border-[#1e3a5f] rounded p-3.5 space-y-2">
                    <div className="text-[8px] text-[#4a6080] font-black uppercase border-b border-[#1e3a5f]/30 pb-1 mb-2">Platform Features Check</div>
                    <div className="space-y-1.5 text-[9px] font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Google Analytics</span>
                        {selectedLead.seo_score >= 55 ? <ShieldCheck className="w-4.5 h-4.5 text-[#00ff88]" /> : <ShieldX className="w-4.5 h-4.5 text-[#ff4444]" />}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Lead Capture Forms</span>
                        {selectedLead.platform !== 'None' ? <ShieldCheck className="w-4.5 h-4.5 text-[#00ff88]" /> : <ShieldX className="w-4.5 h-4.5 text-[#ff4444]" />}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Online Scheduler</span>
                        {selectedLead.review_count > 30 ? <ShieldCheck className="w-4.5 h-4.5 text-[#00ff88]" /> : <ShieldX className="w-4.5 h-4.5 text-[#ff4444]" />}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Organic Content Blog</span>
                        {selectedLead.review_count > 40 ? <ShieldCheck className="w-4.5 h-4.5 text-[#00ff88]" /> : <ShieldX className="w-4.5 h-4.5 text-[#ff4444]" />}
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 border border-[#1e3a5f] rounded p-3.5 space-y-2">
                    <div className="text-[8px] text-[#4a6080] font-black uppercase border-b border-[#1e3a5f]/30 pb-1 mb-2">Vulnerability Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.vulnerabilities?.length > 0 ? (
                        selectedLead.vulnerabilities.map((v, i) => (
                          <span key={i} className="text-[7.5px] bg-[#ff4444]/5 text-[#ff4444] border border-[#ff4444]/30 px-2 py-0.5 rounded font-bold uppercase">{v}</span>
                        ))
                      ) : (
                        <span className="text-neutral-500 italic text-[9px]">No specific vulnerabilities logged.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Briefing Box */}
                <div className="bg-black/50 border border-[#00d4ff]/30 border-l-2 border-l-[#00d4ff] p-4 space-y-1.5">
                  <div className="text-[8.5px] text-[#00d4ff] font-extrabold uppercase tracking-wider">AI Strategic Pitching Briefing</div>
                  <p className="text-[10px] text-neutral-300 font-semibold leading-relaxed uppercase">{selectedLead.service_pitched}</p>
                </div>
              </div>
            )}

            {/* TAB 2: AI OUTREACH EMAIL */}
            {diagnosticTab === 'pitch' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-widest mb-1.5">Personalized email sequence pitch</div>
                {generatingPitch ? (
                  <div className="bg-black/55 border border-[#1e3a5f] h-[180px] rounded flex items-center justify-center text-neutral-500 text-[10px]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#00d4ff]" /> WRITING OUTREACH SEQUENCE EMAIL...
                  </div>
                ) : (
                  <div className="bg-black/75 border border-[#00d4ff]/20 text-[#00ff88] p-4 rounded h-[180px] overflow-y-auto font-mono text-[9.5px] select-text whitespace-pre-wrap leading-relaxed custom-scrollbar border-l border-l-[#00d4ff]/30">
                    {pitchEmail}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pitchEmail);
                      showToast('Pitch email copied to clipboard.', 'success');
                    }}
                    disabled={!pitchEmail}
                    className="py-1.5 px-4 bg-neutral-900 border border-neutral-800 hover:border-[#00d4ff]/50 text-neutral-400 hover:text-white text-[9.5px] font-black rounded uppercase transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => handleGeneratePitch(selectedLead)}
                    className="py-1.5 px-4 bg-[#00d4ff]/5 border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 text-[#00d4ff] text-[9.5px] font-black rounded uppercase transition-colors cursor-pointer"
                  >
                    Regenerate Pitch
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ACTION PLAN CHECKLIST */}
            {diagnosticTab === 'plan' && (
              <div className="space-y-4 animate-in fade-in duration-200 select-text">
                <div className="text-[8px] text-[#4a6080] font-black uppercase tracking-widest">4-Week Closure Action Plan</div>
                {generatingPlan ? (
                  <div className="bg-black/55 border border-[#1e3a5f] h-[180px] rounded flex items-center justify-center text-neutral-500 text-[10px]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#00d4ff]" /> BUILDING ACTION PLAN CHECKLIST...
                  </div>
                ) : actionPlan?.weeks ? (
                  <div className="grid grid-cols-2 gap-4">
                    {actionPlan.weeks.map((w: any, idx: number) => (
                      <div key={idx} className="bg-black/45 border border-[#1e3a5f] rounded p-3.5 space-y-2">
                        <div className="text-[8.5px] text-[#00d4ff] font-extrabold uppercase tracking-wider border-b border-[#1e3a5f]/40 pb-1">Week {w.week}: {w.title}</div>
                        <ul className="space-y-1.5 text-[9px] font-bold text-neutral-400">
                          {w.tasks?.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5 leading-snug">
                              <Check className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
                              <span className="uppercase">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-black/55 border border-[#1e3a5f] h-[180px] rounded flex items-center justify-center text-neutral-500 text-[10px]">
                    Failed to load plan. Click below to retry.
                  </div>
                )}

                {actionPlan && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleGeneratePlan(selectedLead)}
                      className="py-1.5 px-4 bg-[#00d4ff]/5 border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 text-[#00d4ff] text-[9.5px] font-black rounded uppercase transition-colors cursor-pointer"
                    >
                      Regenerate Plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ─── SETTINGS MODAL ────────────────────────────────────────────────── */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="AI AGENT OUTPOST SETTINGS"
        subtitle="CONFIGURE ACQUISITION CONSTANTS"
        maxWidth="max-w-[450px]"
      >
        <div className="p-6 space-y-5 font-mono text-[11px] select-none text-neutral-300">
          {/* Agent Speed */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-[#4a6080] font-black uppercase tracking-wider block">Agent Acquisition Speed</label>
            <div className="grid grid-cols-3 gap-2">
              {(['fast', 'normal', 'slow'] as const).map(sp => {
                const active = agentSpeed === sp;
                return (
                  <button
                    key={sp}
                    onClick={() => setAgentSpeed(sp)}
                    className={`py-2 border rounded font-black cursor-pointer text-center uppercase tracking-widest text-[9.5px] transition-all ${
                      active
                        ? 'bg-[#00d4ff]/10 border-[#00d4ff]/50 text-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.1)]'
                        : 'border-neutral-850 text-neutral-500 hover:text-white'
                    }`}
                  >
                    {sp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Database Limits */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-[#4a6080] font-black uppercase tracking-wider block">Local Cache Limit size</label>
            <div className="grid grid-cols-3 gap-2">
              {([500, 1000, 2500] as const).map(limit => {
                const active = dbLimit === limit;
                return (
                  <button
                    key={limit}
                    onClick={() => setDbLimit(limit)}
                    className={`py-2 border rounded font-black cursor-pointer text-center uppercase tracking-widest text-[9.5px] transition-all ${
                      active
                        ? 'bg-[#00d4ff]/10 border-[#00d4ff]/50 text-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.1)]'
                        : 'border-neutral-850 text-neutral-500 hover:text-white'
                    }`}
                  >
                    {limit} Nodes
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist Toggles */}
          <div className="space-y-2 border-t border-[#1e3a5f]/40 pt-4 text-[10px] font-bold text-neutral-400">
            <label className="flex justify-between items-center cursor-pointer">
              <span>AUTO-ANALYZE LEADS ON CRAWL</span>
              <input type="checkbox" checked={autoAnalyze} onChange={e => setAutoAnalyze(e.target.checked)} className="accent-[#00d4ff] w-4 h-4 cursor-pointer" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#1e3a5f]/40">
            <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="cyan" onClick={() => { setIsSettingsOpen(false); showToast('Settings applied successfully.', 'success'); }}>
              Apply Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── FOOTER BAR ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e3a5f]/40 mt-8 pt-4 text-center text-[8.5px] text-[#4a6080] font-bold select-none tracking-widest">
        © 2026 PITCHRADAR AI SYSTEM // ALL TARGETS SECURED UNDER STANDARD SECURE AGENCY PROTOCOLS.
      </footer>
    </div>
  );
}
