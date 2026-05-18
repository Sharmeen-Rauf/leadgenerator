"use client";

import { useState } from "react";
import { Search, Loader2, Download, CheckCircle2, XCircle, AlertTriangle, Send, Sparkles, Target, Zap, BarChart2, Users, Mail, Globe, Star, Image, Phone, Flame, LayoutDashboard, Building2, MapPin, ChevronRight, Check, Copy, Linkedin, Facebook } from "lucide-react";

export default function Home() {
  const [niche, setNiche] = useState("roofing company");
  const [location, setLocation] = useState("Texas, USA");
  const [service, setService] = useState("Web Design");
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [oppFilter, setOppFilter] = useState("");

  // Credit System
  const [credits, setCredits] = useState(1000);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analysis"); // 'analysis', 'pitch', 'opportunities', 'contacts'
  const [pitchContent, setPitchContent] = useState("");
  const [pitchSubject, setPitchSubject] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [activePage, setActivePage] = useState("scraper");

  const handleSearch = async () => {
    if (!niche && !location) {
      setError("Please enter a niche or location.");
      return;
    }
    
    setError("");
    setIsLoading(true);
    setResults([]);
    setLoadingStep(0);

    try {
      setTimeout(() => setLoadingStep(1), 600);
      setTimeout(() => setLoadingStep(2), 1800);
      setTimeout(() => setLoadingStep(3), 3000);
      setTimeout(() => setLoadingStep(4), 4000);

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, prompt: "" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      
      setResults(data.leads || []);
      setCredits(prev => Math.max(0, prev - (data.leads?.length || 0)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = results.filter(l => {
    const matchQ = !searchFilter || l.companyName.toLowerCase().includes(searchFilter.toLowerCase()) || l.city.toLowerCase().includes(searchFilter.toLowerCase());
    const matchScore = !scoreFilter ||
      (scoreFilter === 'hot' && l.score >= 70) ||
      (scoreFilter === 'warm' && l.score >= 40 && l.score < 70) ||
      (scoreFilter === 'cold' && l.score < 40);
    const matchOpp = !oppFilter || l.opps.includes(oppFilter);
    return matchQ && matchScore && matchOpp;
  });

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ["Business", "Category", "City", "Rating", "Reviews", "Phone", "Email", "Decision Maker", "Direct Email", "Has Website", "AI Score", "Opportunities"];
    const rows = results.map((l: any) => [
      `"${l.companyName}"`,
      `"${l.category}"`,
      `"${l.city}"`,
      `"${l.rating}"`,
      `"${l.reviews}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.decisionMaker}"`,
      `"${l.directEmail}"`,
      `"${l.website !== 'N/A' ? 'Yes' : 'No'}"`,
      `"${l.score}"`,
      `"${l.opps.join(';')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pitchradar_leads_${new Date().getTime()}.csv`);
    link.click();
  };

  const openPitchModal = (lead: any) => {
    setCurrentLead(lead);
    setActiveTab("analysis");
    setModalOpen(true);
    setPitchCopied(false);
  };

  const generatePitch = () => {
    setPitchLoading(true);
    setActiveTab("pitch");
    
    setTimeout(() => {
      const l = currentLead;
      const noSiteStr = "You don't currently have a website — which means potential customers who find you on Google have no way to learn more, see your work, or contact you online.";
      const ratingStr = `Your Google rating of ${l.rating} stars and limited online presence is likely sending customers to your competitors.`;
      
      const subject = `Helping ${l.companyName} get more customers online`;
      const body = `Hi ${l.decisionMaker !== 'N/A' ? l.decisionMaker : '[Owner Name]'},\n\nI came across ${l.companyName} on Google and noticed something that might be costing you customers.\n\n${l.website === 'N/A' ? noSiteStr : ratingStr}\n\nI help ${l.category.toLowerCase()}s like yours get more leads through ${service}. I'd love to share some specific ideas for your business — no cost, no pressure.\n\nWould a 15-min call this week work?\n\nBest,\n[Your Name]`;
      
      setPitchSubject(subject);
      setPitchContent(body);
      setPitchLoading(false);
    }, 1500);
  };

  const copyPitch = () => {
    navigator.clipboard.writeText(`Subject: ${pitchSubject}\n\n${pitchContent}`);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  const handleEnrichLead = async () => {
    if (!currentLead) return;
    setEnriching(true);
    
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyName: currentLead.companyName, 
          website: currentLead.website,
          city: currentLead.city 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enrich");
      
      const enrichedLead = { 
        ...currentLead, 
        decisionMaker: data.decisionMaker !== 'N/A' ? data.decisionMaker : currentLead.decisionMaker,
        title: data.title || 'Owner / Founder',
        linkedinUrl: data.linkedinUrl,
        hasActiveAds: data.hasActiveAds,
        enriched: true
      };
      
      setCurrentLead(enrichedLead);
      setResults(prev => prev.map(l => l.companyName === currentLead.companyName ? enrichedLead : l));
      setCredits(prev => Math.max(0, prev - 10)); // Costs 10 credits for deep enrichment
    } catch (err: any) {
      console.error(err);
      alert("Enrichment failed: " + err.message);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="flex bg-[#09090f] min-h-screen text-[#f0f0f8] font-sans selection:bg-[#4f6ef7]/30">
      {/* SIDEBAR */}
      <div className="sidebar fixed left-0 top-0 bottom-0 w-[240px] bg-[#111118] border-r border-white/5 flex flex-col z-[100]">
        <div className="logo p-7 border-b border-white/5">
          <div className="inline-flex items-center gap-3">
            <div className="w-[32px] h-[32px] bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,110,247,0.3)]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="font-['Syne'] text-[18px] font-bold tracking-tight text-white">PitchRadar</div>
              <div className="text-[10px] text-[#8888a0] tracking-widest uppercase mt-0.5 font-medium">AI Lead Engine</div>
            </div>
          </div>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] tracking-widest uppercase text-[#5a5a72] px-4 pt-4 pb-3 font-semibold">Core</div>
          <div className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-medium transition-all mb-1 ${activePage === 'scraper' ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]' : 'text-[#8888a0] hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('scraper')}>
            <Search className="w-4 h-4" /> Lead Scraper
          </div>
          <div className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-medium transition-all mb-1 ${activePage === 'leads' ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]' : 'text-[#8888a0] hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('leads')}>
            <Target className="w-4 h-4" /> All Leads
          </div>
          <div className="text-[10px] tracking-widest uppercase text-[#5a5a72] px-4 pt-6 pb-3 font-semibold">Outreach</div>
          <div className="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-medium text-[#8888a0] hover:bg-white/5 hover:text-white mb-1 transition-all">
            <Send className="w-4 h-4" /> Campaigns
          </div>
          <div className="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-medium text-[#8888a0] hover:bg-white/5 hover:text-white mb-1 transition-all">
            <BarChart2 className="w-4 h-4" /> Analytics
          </div>
        </nav>
        <div className="p-5 border-t border-white/5 bg-[#111118]">
          <div className="bg-gradient-to-br from-[#4f6ef7]/10 to-[#7c3aed]/10 border border-[#4f6ef7]/20 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:border-[#4f6ef7]/40 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-[#4f6ef7]" />
              <span className="text-xs text-white font-semibold">Pro Plan Active</span>
            </div>
            <div className="text-[11px] text-[#8888a0] flex justify-between items-center">
              <span>{1000 - credits} / 1000 credits</span>
            </div>
            <div className="mt-2.5 h-1 w-full bg-[#16161f] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed]" style={{ width: `${((1000-credits)/1000)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main ml-[240px] flex-1 min-h-screen flex flex-col">
        <div className="topbar px-10 py-5 border-b border-white/5 flex items-center justify-between bg-[#09090f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="font-['Syne'] text-xl font-bold text-white tracking-tight">Lead Scraper</div>
          <div className="flex items-center gap-5">
            <div className="inline-flex items-center gap-2 text-[12px] text-[#22c55e] bg-[#22c55e]/10 px-3 py-1.5 rounded-full border border-[#22c55e]/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span> 
              Live API Connection
            </div>
            <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center text-[13px] font-bold text-white shadow-lg cursor-pointer ring-2 ring-white/10 hover:ring-white/20 transition-all">AK</div>
          </div>
        </div>

        <div className="content-custom px-10 py-8 flex-1">
          {/* SEARCH HERO */}
          <div className="search-hero bg-[#111118] border border-white/5 rounded-[24px] p-8 mb-8 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(79,110,247,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="max-w-2xl relative z-10">
              <h2 className="text-[26px] font-bold mb-2 text-white tracking-tight">Find & Pitch Any Business</h2>
              <p className="text-[#8888a0] text-[15px] mb-8 leading-relaxed">Enter your target criteria below. Our engine will scrape live data, score the leads, identify digital weaknesses, and write highly personalized outreach campaigns.</p>
            </div>
            
            <div className="flex gap-4 items-end flex-wrap relative z-10">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[12px] text-[#8888a0] mb-2 font-semibold uppercase tracking-wider">Business Niche</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a72]" />
                  <input className="w-full bg-[#16161f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-[14px] outline-none focus:border-[#4f6ef7] focus:ring-1 focus:ring-[#4f6ef7] transition-all placeholder:text-[#5a5a72]" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. roofing company" />
                </div>
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[12px] text-[#8888a0] mb-2 font-semibold uppercase tracking-wider">Target Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a72]" />
                  <input className="w-full bg-[#16161f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-[14px] outline-none focus:border-[#4f6ef7] focus:ring-1 focus:ring-[#4f6ef7] transition-all placeholder:text-[#5a5a72]" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Texas, USA" />
                </div>
              </div>
              <div className="w-[200px]">
                <label className="block text-[12px] text-[#8888a0] mb-2 font-semibold uppercase tracking-wider">Your Service</label>
                <select className="w-full bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#4f6ef7] focus:ring-1 focus:ring-[#4f6ef7] transition-all appearance-none cursor-pointer" value={service} onChange={e=>setService(e.target.value)}>
                  <option>Web Design</option>
                  <option>SEO & Content</option>
                  <option>Social Media</option>
                  <option>Google Ads</option>
                  <option>Email Marketing</option>
                  <option>Full Digital Marketing</option>
                </select>
              </div>
              <button onClick={handleSearch} disabled={isLoading} className="bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] text-white px-7 py-3 rounded-xl text-[14px] font-semibold flex items-center gap-2.5 hover:shadow-[0_0_20px_rgba(79,110,247,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all h-[46px]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                {isLoading ? 'Extracting...' : 'Extract Leads'}
              </button>
            </div>
            
            {error && <div className="mt-5 text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
          </div>

          {/* LOADING OVERLAY */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-6 bg-[#111118] rounded-[24px] border border-white/5">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[#4f6ef7] rounded-full animate-spin" />
              </div>
              <div className="font-['Syne'] text-lg font-semibold text-white tracking-wide">Processing Lead Data...</div>
              <div className="flex flex-col gap-3.5 w-full max-w-[360px] bg-[#16161f] p-6 rounded-xl border border-white/5">
                {[
                  'Scanning business directories...', 
                  'Extracting contact information...', 
                  'Analyzing web presence...', 
                  'Running opportunity algorithms...', 
                  'Formatting final output...'
                ].map((text, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[13px] font-medium transition-colors ${loadingStep > i ? 'text-[#22c55e]' : loadingStep === i ? 'text-white' : 'text-[#5a5a72]'}`}>
                    {loadingStep > i ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Loader2 className={`w-4 h-4 shrink-0 ${loadingStep === i ? 'animate-spin text-[#4f6ef7]' : ''}`} />}
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATS */}
          {results.length > 0 && !isLoading && (
            <div className="grid grid-cols-4 gap-5 mb-8">
              <div className="bg-[#111118] border border-white/5 rounded-[20px] p-5 shadow-lg">
                <div className="text-[13px] text-[#8888a0] mb-2.5 flex items-center gap-2 font-medium uppercase tracking-wider"><Target className="w-4 h-4 text-[#4f6ef7]"/> Total Found</div>
                <div className="font-['Syne'] text-[32px] font-bold text-white">{results.length}</div>
                <div className="text-[12px] text-[#8888a0] mt-1.5 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#22c55e]"/> Successfully extracted</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[20px] p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ef4444]/5 to-transparent pointer-events-none" />
                <div className="text-[13px] text-[#8888a0] mb-2.5 flex items-center gap-2 font-medium uppercase tracking-wider relative z-10"><Flame className="w-4 h-4 text-[#ef4444]"/> Hot Leads</div>
                <div className="font-['Syne'] text-[32px] font-bold text-white relative z-10">{results.filter(l => l.score >= 70).length}</div>
                <div className="text-[12px] text-[#8888a0] mt-1.5 relative z-10">Score of 70 or higher</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[20px] p-5 shadow-lg">
                <div className="text-[13px] text-[#8888a0] mb-2.5 flex items-center gap-2 font-medium uppercase tracking-wider"><AlertTriangle className="w-4 h-4 text-[#f59e0b]"/> Missing Web</div>
                <div className="font-['Syne'] text-[32px] font-bold text-white">{results.filter(l => l.website === 'N/A').length}</div>
                <div className="text-[12px] text-[#f59e0b] mt-1.5 font-medium">Prime targets for design</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[20px] p-5 shadow-lg">
                <div className="text-[13px] text-[#8888a0] mb-2.5 flex items-center gap-2 font-medium uppercase tracking-wider"><BarChart2 className="w-4 h-4 text-[#22c55e]"/> Avg Score</div>
                <div className="font-['Syne'] text-[32px] font-bold text-white">{Math.round(results.reduce((a,b)=>a+b.score,0)/results.length) || 0}</div>
                <div className="text-[12px] text-[#8888a0] mt-1.5">Out of 100 possible points</div>
              </div>
            </div>
          )}

          {/* TABLE */}
          {results.length > 0 && !isLoading && (
            <div className="bg-[#111118] border border-white/5 rounded-[20px] overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#16161f]/50">
                <div className="flex items-center gap-4">
                  <h3 className="text-[16px] font-semibold text-white">Extracted Leads</h3>
                  <span className="bg-[#09090f] border border-white/10 rounded-full px-3 py-1 text-[12px] text-[#8888a0] font-medium">{filteredLeads.length} total</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={exportCSV} className="bg-[#16161f] border border-white/10 px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-2 hover:bg-white/5 transition-colors text-white"><Download className="w-4 h-4"/> Export CSV</button>
                  <button className="bg-[#4f6ef7]/10 border border-[#4f6ef7]/30 text-[#4f6ef7] px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:bg-[#4f6ef7]/20 transition-colors"><Zap className="w-4 h-4 fill-current"/> Auto-Pitch All</button>
                </div>
              </div>
              
              <div className="flex gap-3 px-6 py-4 border-b border-white/5 flex-wrap bg-[#111118]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a5a72]" />
                  <input className="bg-[#16161f] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[13px] outline-none focus:border-[#4f6ef7] min-w-[220px] text-white placeholder:text-[#5a5a72] transition-colors" placeholder="Filter company name..." value={searchFilter} onChange={e=>setSearchFilter(e.target.value)} />
                </div>
                <select className="bg-[#16161f] border border-white/10 rounded-lg px-4 py-2 text-[13px] outline-none text-white cursor-pointer focus:border-[#4f6ef7] transition-colors" value={scoreFilter} onChange={e=>setScoreFilter(e.target.value)}>
                  <option value="">All Scores</option>
                  <option value="hot">Hot Leads (70+)</option>
                  <option value="warm">Warm Leads (40-69)</option>
                  <option value="cold">Cold Leads (0-39)</option>
                </select>
                <select className="bg-[#16161f] border border-white/10 rounded-lg px-4 py-2 text-[13px] outline-none text-white cursor-pointer focus:border-[#4f6ef7] transition-colors" value={oppFilter} onChange={e=>setOppFilter(e.target.value)}>
                  <option value="">All Opportunities</option>
                  <option value="web">Web Design Gaps</option>
                  <option value="seo">SEO/Reputation Gaps</option>
                  <option value="social">Social Media Gaps</option>
                  <option value="ads">Advertising Gaps</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#111118] border-b border-white/5">
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">Company</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">Reputation</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">Digital Presence</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">Contact Info</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">AI Score</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold whitespace-nowrap">Gaps Identified</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[#5a5a72] font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l: any, i: number) => {
                      const color = l.score >= 70 ? '#22c55e' : l.score >= 40 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={i} onClick={() => openPitchModal(l)} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group">
                          <td className="px-6 py-4 align-middle">
                            <div className="font-semibold text-[14px] text-white group-hover:text-[#4f6ef7] transition-colors">{l.companyName}</div>
                            <div className="text-[12px] text-[#8888a0] mt-1 font-medium">{l.category} · {l.city}</div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="inline-flex items-center gap-1.5 bg-[#16161f] border border-white/5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-white">
                              <Star className={`w-3.5 h-3.5 ${l.rating >= 4.0 ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#8888a0]'}`}/> 
                              {l.rating > 0 ? `${l.rating} (${l.reviews})` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            {l.website !== 'N/A' ? (
                              <a href={l.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#8888a0] hover:text-white flex items-center gap-1.5 text-[12px] font-medium transition-colors">
                                <Globe className="w-3.5 h-3.5" /> Visit Site
                              </a>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[#ef4444] text-[12px] font-medium bg-[#ef4444]/10 w-fit px-2 py-0.5 rounded-md"><XCircle className="w-3.5 h-3.5"/> Missing</span>
                            )}
                          </td>
                          <td className="px-6 py-4 align-middle text-[12px] text-[#8888a0]">
                            <div className="flex flex-col gap-1.5">
                              {l.phone !== 'N/A' && <span className="flex items-center gap-2 font-medium"><Phone className="w-3.5 h-3.5 text-[#5a5a72]"/> {l.phone}</span>}
                              {l.email && l.email !== 'N/A' && <span className="flex items-center gap-2 text-white font-medium"><Mail className="w-3.5 h-3.5 text-[#5a5a72]"/> {l.email}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-3 w-32">
                              <div className="flex-1 h-1.5 bg-[#16161f] rounded-full overflow-hidden border border-white/5">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${l.score}%`, background: color }}></div>
                              </div>
                              <span className="text-[13px] font-bold w-6" style={{ color }}>{l.score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex gap-1.5 flex-wrap">
                              {l.opps.map((o: string) => {
                                const badges: any = { 
                                  web: { icon: Globe, label: 'Web', class: 'bg-[#4f6ef7]/10 text-[#4f6ef7] border-[#4f6ef7]/20' }, 
                                  seo: { icon: Search, label: 'SEO', class: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' }, 
                                  social: { icon: Image, label: 'Social', class: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20' }, 
                                  ads: { icon: Target, label: 'Ads', class: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' }, 
                                  email: { icon: Mail, label: 'Email', class: 'bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/20' } 
                                };
                                const Badge = badges[o];
                                if (!Badge) return null;
                                return (
                                  <span key={o} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border font-semibold tracking-wide uppercase ${Badge.class}`}>
                                    <Badge.icon className="w-3 h-3" /> {Badge.label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <button onClick={(e) => { e.stopPropagation(); openPitchModal(l); }} className="bg-[#16161f] border border-white/10 text-white px-4 py-2 rounded-lg text-[12px] font-semibold group-hover:bg-[#4f6ef7] group-hover:border-[#4f6ef7] transition-all flex items-center gap-2 ml-auto">
                              <Sparkles className="w-3.5 h-3.5" /> AI Pitch
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {results.length === 0 && !isLoading && (
            <div className="text-center py-24 text-[#8888a0] bg-[#111118] border border-white/5 rounded-[24px] mt-8 shadow-lg flex flex-col items-center">
              <div className="w-16 h-16 bg-[#16161f] rounded-2xl flex items-center justify-center mb-5 border border-white/5">
                <Target className="w-8 h-8 text-[#5a5a72]" />
              </div>
              <h3 className="font-['Syne'] text-[22px] text-white mb-2 font-bold tracking-tight">Ready to generate leads</h3>
              <p className="text-[15px] max-w-md mx-auto leading-relaxed">Configure your search parameters above. Our AI engine will automatically discover businesses, score their digital presence, and build personalized outreach campaigns.</p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL */}
      {modalOpen && currentLead && (
        <div className="fixed inset-0 bg-[#09090f]/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-[#111118] border border-white/10 rounded-[24px] w-full max-w-[800px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-start bg-[#16161f]/30">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4f6ef7]/20 to-[#7c3aed]/20 border border-[#4f6ef7]/30 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#4f6ef7]" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight">{currentLead.companyName}</h3>
                  <div className="flex items-center gap-3 text-[13px] text-[#8888a0] mt-1.5 font-medium">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {currentLead.city}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5"/> {currentLead.category}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 bg-[#16161f] border border-white/10 rounded-xl flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex gap-2 mb-8 bg-[#16161f] rounded-xl p-1.5 border border-white/5">
                <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[13px] rounded-lg font-semibold transition-all ${activeTab === 'analysis' ? 'bg-[#111118] text-white shadow-md border border-white/5' : 'text-[#8888a0] hover:text-white'}`}><BarChart2 className="w-4 h-4"/> Overview</button>
                <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[13px] rounded-lg font-semibold transition-all ${activeTab === 'contacts' ? 'bg-[#111118] text-white shadow-md border border-white/5' : 'text-[#8888a0] hover:text-white'}`}><Users className="w-4 h-4"/> Contacts</button>
                <button onClick={() => { setActiveTab('pitch'); if (!pitchContent) generatePitch(); }} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[13px] rounded-lg font-semibold transition-all ${activeTab === 'pitch' ? 'bg-[#111118] text-white shadow-md border border-white/5' : 'text-[#8888a0] hover:text-white'}`}><Mail className="w-4 h-4"/> AI Pitch</button>
                <button onClick={() => setActiveTab('opportunities')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[13px] rounded-lg font-semibold transition-all ${activeTab === 'opportunities' ? 'bg-[#111118] text-white shadow-md border border-white/5' : 'text-[#8888a0] hover:text-white'}`}><Target className="w-4 h-4"/> Action Plan</button>
              </div>

              {/* TAB CONTENT: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[15px] font-bold text-white tracking-tight">Key Decision Makers</h4>
                    {!currentLead.enriched && (
                      <button onClick={handleEnrichLead} disabled={enriching} className="bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] text-white px-4 py-2 rounded-lg text-[12px] font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(79,110,247,0.4)] disabled:opacity-50 transition-all">
                        {enriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {enriching ? 'Enriching...' : 'Deep Search (10 Credits)'}
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-6 mb-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                    {enriching && (
                      <div className="absolute inset-0 bg-[#09090f]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-[#4f6ef7] animate-spin" />
                        <span className="text-[12px] font-semibold text-white tracking-wide">Scraping LinkedIn & Meta Ads...</span>
                      </div>
                    )}
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center text-[20px] font-bold text-white shrink-0 shadow-lg ring-4 ring-[#4f6ef7]/10">
                        {currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-white tracking-tight">{currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker : 'Unknown Contact'}</div>
                        <div className="text-[13px] text-[#8888a0] font-medium mt-0.5">{currentLead.title || 'Owner / Founder'}</div>
                        <div className="flex items-center gap-3 mt-2">
                          {currentLead.directEmail !== 'N/A' && <div className="text-[12px] text-[#22c55e] flex items-center gap-1.5 font-medium bg-[#22c55e]/10 px-2.5 py-1 rounded-md"><Mail className="w-3.5 h-3.5"/> {currentLead.directEmail}</div>}
                          {currentLead.linkedinUrl && currentLead.linkedinUrl !== 'N/A' && (
                            <a href={currentLead.linkedinUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#0077b5] flex items-center gap-1.5 font-medium bg-[#0077b5]/10 px-2.5 py-1 rounded-md hover:underline"><Linkedin className="w-3.5 h-3.5"/> LinkedIn Profile</a>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentLead.enriched ? (
                      <span className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Fully Enriched</span>
                    ) : currentLead.decisionMaker !== 'N/A' ? (
                      <span className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>
                    ) : (
                      <span className="bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Needs Enrichment</span>
                    )}
                  </div>

                  {currentLead.enriched && (
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                        <div className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-2 font-bold flex items-center gap-2"><Facebook className="w-4 h-4"/> Meta Ads</div>
                        <div className={`text-[14px] font-bold ${currentLead.hasActiveAds ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {currentLead.hasActiveAds ? 'Active Campaigns Found' : 'No Active Ads'}
                        </div>
                      </div>
                      <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                        <div className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-2 font-bold flex items-center gap-2"><Linkedin className="w-4 h-4"/> Network Match</div>
                        <div className="text-[14px] font-bold text-white">Profile Identified</div>
                      </div>
                    </div>
                  )}

                  {!currentLead.enriched && (
                    <div className="bg-[#4f6ef7]/5 border border-[#4f6ef7]/10 rounded-xl p-4 text-[13px] text-[#8888a0] leading-relaxed flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#4f6ef7] shrink-0 mt-0.5"/>
                      <p>Run a <strong className="text-white">Deep Search</strong> to orchestrate LinkedIn and Meta Ads scrapers specifically for this prospect. This will consume 10 credits due to compute intensity.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: ANALYSIS */}
              {activeTab === 'analysis' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 shadow-sm">
                      <h4 className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-4 font-bold flex items-center gap-2"><Globe className="w-4 h-4"/> Web Presence</h4>
                      <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[13px] text-[#8888a0] font-medium">Domain Active</span><span className={`text-[13px] font-bold flex items-center gap-1.5 ${currentLead.website !== 'N/A' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{currentLead.website !== 'N/A' ? <><AlertTriangle className="w-3.5 h-3.5"/> Needs Review</> : <><XCircle className="w-3.5 h-3.5"/> Missing</>}</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-[13px] text-[#8888a0] font-medium">Mobile Optimization</span><span className="text-[13px] font-bold text-[#ef4444] flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Critical</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 shadow-sm">
                      <h4 className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-4 font-bold flex items-center gap-2"><Star className="w-4 h-4"/> Reputation</h4>
                      <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[13px] text-[#8888a0] font-medium">Aggregate Rating</span><span className={`text-[13px] font-bold flex items-center gap-1.5 ${currentLead.rating >= 4.0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}><Star className={`w-3.5 h-3.5 ${currentLead.rating >= 4.0 ? 'fill-current' : ''}`}/> {currentLead.rating || 'N/A'}</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-[13px] text-[#8888a0] font-medium">Review Volume</span><span className="text-[13px] font-bold text-white">{currentLead.reviews}</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 shadow-sm">
                      <h4 className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-4 font-bold flex items-center gap-2"><Image className="w-4 h-4"/> Social Signals</h4>
                      <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[13px] text-[#8888a0] font-medium">Facebook Page</span><span className={`text-[13px] font-bold flex items-center gap-1.5 ${currentLead.social?.fb ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{currentLead.social?.fb ? <><CheckCircle2 className="w-3.5 h-3.5"/> Verified</> : <><XCircle className="w-3.5 h-3.5"/> None</>}</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-[13px] text-[#8888a0] font-medium">Instagram Profile</span><span className={`text-[13px] font-bold flex items-center gap-1.5 ${currentLead.social?.insta ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{currentLead.social?.insta ? <><CheckCircle2 className="w-3.5 h-3.5"/> Verified</> : <><XCircle className="w-3.5 h-3.5"/> None</>}</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 shadow-sm">
                      <h4 className="text-[12px] uppercase tracking-wider text-[#5a5a72] mb-4 font-bold flex items-center gap-2"><Search className="w-4 h-4"/> Visibility</h4>
                      <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[13px] text-[#8888a0] font-medium">Local Pack Rank</span><span className="text-[13px] font-bold text-[#ef4444] flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Weak</span></div>
                      <div className="flex justify-between items-center py-2"><span className="text-[13px] text-[#8888a0] font-medium">Keyword Index</span><span className="text-[13px] font-bold text-[#ef4444] flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Poor</span></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#4f6ef7]/10 to-transparent border-l-4 border-[#4f6ef7] rounded-r-xl p-5 text-[14px] text-[#8888a0] leading-relaxed flex gap-4">
                    <Sparkles className="w-6 h-6 text-[#4f6ef7] shrink-0"/>
                    <div>
                      <strong className="text-white block mb-1">AI Diagnostic Report</strong> 
                      {currentLead.companyName} has identifiable revenue leaks in their digital funnel. {currentLead.website === 'N/A' && <span className="text-white">The absence of a dedicated domain is their primary growth blocker. </span>} {currentLead.rating < 4.0 && <span className="text-white">Reputation scores below 4.0 are causing severe local search penalties. </span>} Algorithm designates this as a <strong className={currentLead.score >= 70 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>{currentLead.score >= 70 ? 'High-Priority' : 'Moderate-Priority'} target</strong> for {service} solutions.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PITCH */}
              {activeTab === 'pitch' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[#16161f] border border-white/10 rounded-xl p-4 text-[13px] mb-5 flex items-center gap-3">
                    <div className="bg-[#4f6ef7]/10 text-[#4f6ef7] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">Subject</div>
                    <span className="font-medium text-white">{pitchSubject || 'Analyzing parameters...'}</span>
                  </div>
                  <div className={`bg-[#09090f] border border-white/5 rounded-[16px] p-6 text-[14px] leading-loose whitespace-pre-wrap font-medium shadow-inner ${pitchLoading ? 'text-[#5a5a72] animate-pulse flex items-center justify-center min-h-[200px]' : 'text-white'}`}>
                    {pitchLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Sparkles className="w-6 h-6 text-[#4f6ef7] animate-pulse" />
                        Generating personalized copy...
                      </div>
                    ) : pitchContent}
                  </div>
                  {!pitchLoading && (
                    <div className="flex justify-end mt-5">
                      <button onClick={copyPitch} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border ${pitchCopied ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-[#16161f] text-white border-white/10 hover:bg-[#4f6ef7] hover:border-[#4f6ef7] shadow-lg'}`}>
                        {pitchCopied ? <><CheckCircle2 className="w-4 h-4"/> Copied to Clipboard</> : <><Copy className="w-4 h-4"/> Copy to Clipboard</>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: OPPORTUNITIES */}
              {activeTab === 'opportunities' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4f6ef7]/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[#4f6ef7]"/>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-white tracking-tight">Identified Conversion Gaps</h4>
                      <div className="text-[13px] text-[#8888a0] font-medium">Found {currentLead.opps.length} measurable deficiencies for {service} solutions.</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {currentLead.opps.includes('web') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#4f6ef7]/10 flex items-center justify-center shrink-0 border border-[#4f6ef7]/20">
                          <Globe className="w-5 h-5 text-[#4f6ef7]" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Deploy Dedicated Infrastructure 
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] font-bold uppercase tracking-wider flex items-center gap-1"><Flame className="w-3 h-3"/> High Impact</span>
                          </div>
                          <div className="text-[13px] text-[#8888a0] leading-relaxed font-medium">Target lacks primary domain routing. Current prospective traffic experiences 100% bounce rate at discovery phase. Implementing optimized architecture yields immediate lead capture capability.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('seo') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0 border border-[#f59e0b]/20">
                          <Star className="w-5 h-5 text-[#f59e0b]" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Reputation Recovery Protocol
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] font-bold uppercase tracking-wider flex items-center gap-1"><Flame className="w-3 h-3"/> High Impact</span>
                          </div>
                          <div className="text-[13px] text-[#8888a0] leading-relaxed font-medium">Aggregate score ({currentLead.rating}★) sits below the algorithmic trust threshold. Implementing review gating and response automation will normalize metrics within current quarter.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('social') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 flex items-center justify-center shrink-0 border border-[#a855f7]/20">
                          <Image className="w-5 h-5 text-[#a855f7]" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Social Channel Activation
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3"/> Med Impact</span>
                          </div>
                          <div className="text-[13px] text-[#8888a0] leading-relaxed font-medium">Zero presence detected on high-velocity discovery networks. Initiating content syndication will capture local organic search volume currently lost to competitors.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-white/5 flex gap-3 justify-end bg-[#16161f]/50">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#111118] border border-white/10 text-[#8888a0] hover:text-white hover:bg-[#16161f] transition-all">Dismiss</button>
              <button onClick={() => { setActiveTab('pitch'); generatePitch(); }} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#4f6ef7]/10 border border-[#4f6ef7]/30 text-[#4f6ef7] hover:bg-[#4f6ef7]/20 transition-all flex items-center gap-2"><Sparkles className="w-4 h-4"/> Regenerate Sequence</button>
              <button onClick={() => alert('📤 Enterprise Outreach Module locked in Demo Mode')} className="px-5 py-2.5 rounded-xl text-[13px] font-bold bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] text-white hover:shadow-[0_0_20px_rgba(79,110,247,0.4)] transition-all flex items-center gap-2"><Send className="w-4 h-4"/> Initiate Outreach</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
