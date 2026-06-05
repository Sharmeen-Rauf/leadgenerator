'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Globe, Search, Shield, ShieldCheck, ShieldX, Database,
  Download, CheckSquare, Square, Flame, Mail, Phone, ExternalLink,
  Loader2, XCircle, Activity, Zap, ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface BulkScraperProps {
  onAddLeads: (leads: any[]) => Promise<any>;
  setActivePage: (page: string) => void;
}

interface StreamedLead {
  company_name: string;
  website: string;
  email: string;
  phone: string;
  ai_score: number;
  opportunity_temp: 'cold' | 'warm' | 'hot';
  gaps: string[];
  niche: string;
  location: string;
  rating: number;
  review_count: number;
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
  mx_verified?: boolean;
  source_query?: string;
  service_pitched?: string;
}

const COUNTRIES = [
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'in', label: 'India' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'es', label: 'Spain' },
  { code: 'it', label: 'Italy' },
  { code: 'nl', label: 'Netherlands' },
  { code: 'br', label: 'Brazil' },
  { code: 'ae', label: 'United Arab Emirates' },
];

const MAX_RESULTS_OPTIONS = [10, 25, 50, 100];

export const BulkScraper: React.FC<BulkScraperProps> = ({ onAddLeads, setActivePage }) => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('us');
  const [maxResults, setMaxResults] = useState(25);
  const [scanning, setScanning] = useState(false);
  const [leads, setLeads] = useState<StreamedLead[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [committing, setCommitting] = useState(false);
  const [committingSelected, setCommittingSelected] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Live stats computed from streamed leads
  const stats = useMemo(() => {
    const total = leads.length;
    const verified = leads.filter(l => l.mx_verified === true).length;
    const hot = leads.filter(l => l.opportunity_temp === 'hot').length;
    const avgScore = total > 0 ? Math.round(leads.reduce((sum, l) => sum + l.ai_score, 0) / total) : 0;
    return { total, verified, hot, avgScore };
  }, [leads]);

  const tempGlows: Record<string, string> = {
    cold: 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_8px_rgba(0,212,255,0.15)]',
    warm: 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30 shadow-[0_0_8px_rgba(255,184,0,0.15)]',
    hot: 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30 shadow-[0_0_8px_rgba(255,51,102,0.15)]',
  };

  const handleLaunchScan = useCallback(async () => {
    if (!keyword.trim()) return;

    setScanning(true);
    setScanComplete(false);
    setLeads([]);
    setSelected(new Set());

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/scrape/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), country, maxResults }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);

          if (payload === '[DONE]') {
            setScanComplete(true);
            setScanning(false);
            return;
          }

          try {
            const raw = JSON.parse(payload);
            // Skip progress events and error events
            if (raw.type === 'progress' || raw.type === 'error') continue;
            // Map from API format (camelCase) to component format (snake_case)
            const lead: StreamedLead = {
              company_name: raw.companyName || raw.company_name || 'Unknown',
              website: raw.website || 'N/A',
              email: raw.email || raw.directEmail || 'N/A',
              phone: raw.phone || 'N/A',
              ai_score: Number(raw.score || raw.ai_score) || 0,
              opportunity_temp: (raw.temperature?.toLowerCase() || raw.opportunity_temp || 'cold') as 'cold' | 'warm' | 'hot',
              gaps: (raw.opps || raw.gaps || []).map((g: string) => g.toUpperCase()),
              niche: raw.category || raw.niche || 'N/A',
              location: raw.city || raw.location || 'N/A',
              rating: Number(raw.rating) || 0,
              review_count: Number(raw.reviews || raw.review_count) || 0,
              est_revenue_loss: Number(raw.scoring?.revenue?.estimatedMonthlyLoss || raw.est_revenue_loss) || 0,
              deal_value_min: Number(raw.scoring?.revenue?.estimatedMonthlyLoss || 0) * 3,
              deal_value_max: Number(raw.scoring?.revenue?.estimatedMonthlyLoss || 0) * 6,
              platform: raw.siteAnalysis?.cms || raw.platform || 'N/A',
              site_speed: raw.siteAnalysis?.loadTime > 4000 ? 'Slow' : 'Fast',
              ssl_status: raw.siteAnalysis?.ssl ? 'Valid' : 'Invalid',
              seo_score: Number(raw.siteAnalysis?.seoScore || raw.seo_score) || 0,
              vulnerabilities: raw.siteAnalysis?.opportunities || raw.vulnerabilities || [],
              crm_status: 'new',
              notes: [
                `Decision Maker: ${raw.decisionMaker || 'N/A'}`,
                ...(raw.siteAnalysis?.opportunities || [])
              ].join('\n'),
              mx_verified: raw.mx_verified,
              source_query: keyword,
              service_pitched: raw.scoring?.revenue?.topService || 'N/A',
            };
            setLeads(prev => [...prev, lead]);
          } catch {
            // skip malformed JSON
          }
        }
      }

      setScanComplete(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Bulk scan error:', err);
      }
    } finally {
      setScanning(false);
      abortRef.current = null;
    }
  }, [keyword, country, maxResults]);

  const handleAbort = () => {
    abortRef.current?.abort();
    setScanning(false);
    setScanComplete(true);
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((_, i) => i)));
    }
  };

  const handleCommitAll = async () => {
    if (leads.length === 0) return;
    setCommitting(true);
    try {
      const res = await onAddLeads(leads);
      if (res) {
        setLeads([]);
        setSelected(new Set());
        setActivePage('leads');
      }
    } finally {
      setCommitting(false);
    }
  };

  const handleCommitSelected = async () => {
    const selectedLeads = leads.filter((_, i) => selected.has(i));
    if (selectedLeads.length === 0) return;
    setCommittingSelected(true);
    try {
      const res = await onAddLeads(selectedLeads);
      if (res) {
        setLeads(prev => prev.filter((_, i) => !selected.has(i)));
        setSelected(new Set());
      }
    } finally {
      setCommittingSelected(false);
    }
  };

  const handleCommitIndividual = async (lead: StreamedLead, index: number) => {
    try {
      const res = await onAddLeads([lead]);
      if (res) {
        setLeads(prev => prev.filter((_, i) => i !== index));
        setSelected(prev => {
          const next = new Set(prev);
          next.delete(index);
          const shifted = new Set<number>();
          next.forEach(i => {
            if (i > index) {
              shifted.add(i - 1);
            } else {
              shifted.add(i);
            }
          });
          return shifted;
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Company', 'Website', 'Email', 'Phone', 'AI Score', 'Temp', 'Gaps', 'Location', 'Niche', 'SEO Score', 'Est Revenue Loss'];
    const rows = leads.map(l => [
      l.company_name,
      l.website,
      l.email,
      l.phone,
      l.ai_score,
      l.opportunity_temp,
      (l.gaps || []).join('; '),
      l.location,
      l.niche,
      l.seo_score,
      l.est_revenue_loss,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitchradar-bulk-${keyword.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderScore = (score: number) => {
    const segments = [1, 2, 3, 4, 5];
    const filledCount = Math.ceil(score / 20);
    const color = score >= 70 ? 'bg-[#39FF14]' : score >= 40 ? 'bg-[#FFB800]' : 'bg-[#FF3366]';
    const glowClass = score >= 70 ? 'shadow-[0_0_8px_#39FF14]' : score >= 40 ? 'shadow-[0_0_8px_#FFB800]' : 'shadow-[0_0_8px_#FF3366]';

    return (
      <div className="flex flex-col items-center gap-1 select-none font-mono">
        <div className="flex gap-0.5">
          {segments.map((seg) => (
            <div
              key={seg}
              className={`h-2.5 w-1.5 rounded-sm transition-all duration-500 ${
                seg <= filledCount ? `${color} ${glowClass}` : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
        <span className="text-[8px] text-neutral-500 font-bold">{score} PTS</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 select-none">
      {/* ── Input Form Panel ── */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15 font-mono">
        <div className="flex items-center gap-2 border-b border-[#00D4FF]/10 pb-3 mb-4">
          <Radar className="w-4.5 h-4.5 text-[#00D4FF] animate-spin" style={{ animationDuration: '4s' }} />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Bulk Reconnaissance Scanner</h3>
          <Badge variant="cyan">SSE STREAM</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Keyword Input */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Target Keyword / Niche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-4 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all uppercase"
                placeholder="e.g. DENTISTS, PLUMBERS, RESTAURANTS..."
                disabled={scanning}
              />
            </div>
          </div>

          {/* Country Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Country Region</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-8 py-2.5 w-full text-xs outline-none text-neutral-300 font-semibold focus:border-[#00D4FF] transition-all uppercase cursor-pointer appearance-none"
                disabled={scanning}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          {/* Max Results */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Max Results</label>
            <div className="flex gap-1.5">
              {MAX_RESULTS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setMaxResults(opt)}
                  disabled={scanning}
                  className={`flex-1 py-2.5 rounded text-[10px] font-extrabold uppercase cursor-pointer transition-all duration-300 border ${
                    maxResults === opt
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.1)]'
                      : 'border-neutral-800 text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#00D4FF]/10">
          <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
            {scanning ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                LIVE STREAM ACTIVE — INTERCEPTING DATA NODES...
              </span>
            ) : scanComplete ? (
              <span className="text-[#39FF14]">✓ SCAN COMPLETE — {leads.length} NODES CAPTURED</span>
            ) : (
              'CONFIGURE PARAMETERS AND LAUNCH SCAN'
            )}
          </div>
          <div className="flex gap-3">
            {scanning && (
              <Button variant="pink" size="sm" onClick={handleAbort}>
                <XCircle className="w-3.5 h-3.5" /> Abort Scan
              </Button>
            )}
            <Button
              variant="radar"
              size="sm"
              onClick={handleLaunchScan}
              disabled={scanning || !keyword.trim()}
              loading={scanning}
            >
              <Zap className="w-3.5 h-3.5" /> Launch Bulk Scan
            </Button>
          </div>
        </div>
      </div>

      {/* ── Live Stats Bar ── */}
      <AnimatePresence>
        {(scanning || leads.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="tactical-glass p-4 border-[#00D4FF]/15 font-mono"
          >
            {/* Progress bar */}
            {scanning && (
              <div className="mb-4">
                <div className="h-3 bg-black/60 border border-[#00D4FF]/20 rounded relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:10px_100%] pointer-events-none" />
                  <div
                    className="h-full bg-gradient-to-r from-[#00D4FF] via-[#39FF14] to-[#00D4FF] transition-all duration-300 relative"
                    style={{ width: `${Math.min((stats.total / maxResults) * 100, 100)}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#39FF14]" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              {/* Total Found */}
              <div className="bg-black/40 border border-neutral-800/60 rounded-md p-3 text-center">
                <div className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest mb-1">Total Found</div>
                <div className="text-lg font-extrabold text-[#00D4FF] leading-none">
                  {stats.total}
                  <span className="text-[9px] text-neutral-500 font-bold ml-1">/ {maxResults}</span>
                </div>
              </div>

              {/* Verified Emails */}
              <div className="bg-black/40 border border-neutral-800/60 rounded-md p-3 text-center">
                <div className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest mb-1">Verified Emails</div>
                <div className="text-lg font-extrabold text-[#39FF14] leading-none">
                  {stats.verified}
                  <Mail className="w-3.5 h-3.5 inline ml-1.5 text-[#39FF14]/60" />
                </div>
              </div>

              {/* Hot Leads */}
              <div className="bg-black/40 border border-neutral-800/60 rounded-md p-3 text-center">
                <div className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest mb-1">Hot Leads</div>
                <div className="text-lg font-extrabold text-[#FF3366] leading-none">
                  {stats.hot}
                  <Flame className="w-3.5 h-3.5 inline ml-1.5 text-[#FF3366]/60" />
                </div>
              </div>

              {/* Average Score */}
              <div className="bg-black/40 border border-neutral-800/60 rounded-md p-3 text-center">
                <div className="text-[8px] text-neutral-500 font-extrabold uppercase tracking-widest mb-1">Avg Score</div>
                <div className={`text-lg font-extrabold leading-none ${
                  stats.avgScore >= 70 ? 'text-[#39FF14]' : stats.avgScore >= 40 ? 'text-[#FFB800]' : 'text-[#FF3366]'
                }`}>
                  {stats.avgScore}
                  <Activity className="w-3.5 h-3.5 inline ml-1.5 opacity-60" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Live Results Table ── */}
      <AnimatePresence>
        {leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="tactical-glass p-5 border-[#00D4FF]/15 font-mono"
          >
            <div className="flex items-center justify-between border-b border-[#00D4FF]/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#39FF14]" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Scraped Leads Preview ({leads.length} Nodes)
                </h3>
                {scanning && (
                  <span className="flex items-center gap-1.5 text-[9px] text-[#39FF14] font-bold uppercase">
                    <Loader2 className="w-3 h-3 animate-spin" /> Streaming...
                  </span>
                )}
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-[9px] text-neutral-400 hover:text-[#00D4FF] font-extrabold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {selected.size === leads.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#00D4FF]" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selected.size === leads.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-[#00D4FF]/10 text-neutral-500 font-extrabold uppercase">
                    <th className="py-2 pr-2 w-8"></th>
                    <th className="py-2 pr-4">Business Entity</th>
                    <th className="py-2 px-4">Website</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 px-4">Phone</th>
                    <th className="py-2 px-4 text-center">Score</th>
                    <th className="py-2 px-4 text-center">Temp</th>
                    <th className="py-2 px-4">Gaps</th>
                    <th className="py-2 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00D4FF]/5 text-neutral-300 font-semibold">
                  <AnimatePresence>
                    {leads.map((lead, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 pr-2">
                          <button
                            onClick={() => toggleSelect(idx)}
                            className="cursor-pointer text-neutral-500 hover:text-[#00D4FF] transition-colors"
                          >
                            {selected.has(idx) ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[#00D4FF]" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Company */}
                        <td className="py-2.5 pr-4">
                          <div className="font-extrabold text-white uppercase">{lead.company_name}</div>
                          <div className="text-[8px] text-neutral-500 uppercase">{lead.niche}</div>
                        </td>

                        {/* Website */}
                        <td className="py-2.5 px-4">
                          {lead.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[120px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          ) : (
                            <span className="text-neutral-600">N/A</span>
                          )}
                        </td>

                        {/* Email with MX Badge */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {lead.mx_verified === true ? (
                              <ShieldCheck className="w-3 h-3 text-[#39FF14] shrink-0" />
                            ) : lead.mx_verified === false ? (
                              <ShieldX className="w-3 h-3 text-[#FF3366] shrink-0" />
                            ) : null}
                            <span className={`truncate max-w-[140px] ${lead.email ? 'text-white' : 'text-neutral-600'}`}>
                              {lead.email || 'N/A'}
                            </span>
                          </div>
                          {lead.mx_verified !== undefined && (
                            <span className={`text-[7px] font-extrabold uppercase tracking-widest mt-0.5 block ${
                              lead.mx_verified ? 'text-[#39FF14]/70' : 'text-[#FF3366]/70'
                            }`}>
                              {lead.mx_verified ? '✓ MX VALID' : '✗ MX FAIL'}
                            </span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-2.5 px-4">
                          {lead.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="text-neutral-600">N/A</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-2.5 px-4 text-center">
                          {renderScore(lead.ai_score)}
                        </td>

                        {/* Temp */}
                        <td className="py-2.5 px-4 text-center">
                          <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest ${tempGlows[lead.opportunity_temp] || 'bg-neutral-800 text-white'}`}>
                            {lead.opportunity_temp}
                          </span>
                        </td>

                        {/* Gaps */}
                        <td className="py-2.5 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {(lead.gaps || []).map(g => {
                              const gapColors: Record<string, 'cyan' | 'green' | 'amber' | 'pink' | 'default'> = {
                                SEO: 'cyan',
                                SOCIAL: 'green',
                                EMAIL: 'amber',
                                ADS: 'pink',
                                WEB: 'default',
                              };
                              return <Badge key={g} variant={gapColors[g] || 'default'}>{g}</Badge>;
                            })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <span className="text-[#FFB800] font-bold text-[9px]">
                              ${(lead.est_revenue_loss || 0).toLocaleString()}/mo
                            </span>
                            <button
                              onClick={() => handleCommitIndividual(lead, idx)}
                              className="shimmer-btn bg-neutral-900 border border-[#39FF14]/25 hover:bg-[#39FF14] hover:text-[#080C18] text-[#39FF14] px-2.5 py-1 rounded text-[9px] font-mono font-extrabold uppercase transition-all duration-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Database className="w-2.5 h-2.5" /> Save to CRM
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Bar ── */}
      <AnimatePresence>
        {leads.length > 0 && !scanning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="tactical-glass p-4 border-[#00D4FF]/15 font-mono"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="cyan">{leads.length} LEADS</Badge>
                {selected.size > 0 && (
                  <Badge variant="amber">{selected.size} SELECTED</Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleExportCSV}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>

                {selected.size > 0 && (
                  <Button
                    variant="amber"
                    size="sm"
                    onClick={handleCommitSelected}
                    loading={committingSelected}
                    disabled={committingSelected}
                  >
                    <Database className="w-3.5 h-3.5" /> Save Selected to CRM
                  </Button>
                )}

                <Button
                  variant="green"
                  size="sm"
                  onClick={handleCommitAll}
                  loading={committing}
                  disabled={committing}
                >
                  <Database className="w-3.5 h-3.5" /> Save All {leads.length} to CRM
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
