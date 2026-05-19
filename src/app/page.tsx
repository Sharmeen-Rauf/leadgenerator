"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Download, CheckCircle2, XCircle, AlertTriangle, Send, Sparkles, Target, Zap, BarChart2, Users, Mail, Globe, Star, Image, Phone, Flame, LayoutDashboard, Building2, MapPin, ChevronRight, Check, Copy, Network, Activity, DollarSign, TrendingUp, Shield, MessageSquare, Filter, CheckSquare, Square, Eye, EyeOff } from "lucide-react";

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
  const [crmFilter, setCrmFilter] = useState("all");

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
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [activePage, setActivePage] = useState("scraper");
  const [leadStatuses, setLeadStatuses] = useState<Record<string, 'new' | 'checked' | 'contacted'>>({});

  // Load CRM statuses on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("leadStatuses");
      if (stored) {
        setLeadStatuses(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading statuses:", e);
    }
  }, []);

  const updateLeadStatus = (companyName: string, status: 'new' | 'checked' | 'contacted') => {
    const updated = { ...leadStatuses, [companyName]: status };
    setLeadStatuses(updated);
    try {
      localStorage.setItem("leadStatuses", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving statuses:", e);
    }
  };

  const fetchReviews = async (lead: any) => {
    if (reviewsData) return;
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeUrl: lead.placeUrl, placeName: lead.companyName }),
      });
      const data = await res.json();
      setReviewsData(data);
    } catch { setReviewsData(null); }
    setReviewsLoading(false);
  };

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
    const currentStatus = leadStatuses[l.companyName] || 'new';
    const matchCrm = crmFilter === 'all' || crmFilter === currentStatus;
    return matchQ && matchScore && matchOpp && matchCrm;
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
    
    // Automatically update CRM status to checked if currently new
    const currentStatus = leadStatuses[lead.companyName] || 'new';
    if (currentStatus === 'new') {
      updateLeadStatus(lead.companyName, 'checked');
    }
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
    if (currentLead) {
      updateLeadStatus(currentLead.companyName, 'contacted');
    }
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

  const totalLeadsCount = results.length;
  const hotLeadsCount = results.filter(l => l.score >= 70).length;
  const warmLeadsCount = results.filter(l => l.score >= 40 && l.score < 70).length;
  const coldLeadsCount = results.filter(l => l.score < 40).length;

  const statusNew = results.filter(l => !leadStatuses[l.companyName] || leadStatuses[l.companyName] === 'new').length;
  const statusChecked = results.filter(l => leadStatuses[l.companyName] === 'checked').length;
  const statusContacted = results.filter(l => leadStatuses[l.companyName] === 'contacted').length;

  const totalMonthlyLoss = results.reduce((acc, lead) => acc + (lead.monthlyLoss || 0), 0);
  const avgOpportunityScore = Math.round(results.reduce((acc, lead) => acc + lead.score, 0) / (results.length || 1));

  return (
    <div className="flex bg-[#050505] min-h-screen text-white font-sans selection:bg-white/20">
      {/* SIDEBAR */}
      <div className="sidebar fixed left-0 top-0 bottom-0 w-[240px] bg-[#0c0c0c] border-r border-neutral-800 flex flex-col z-[100]">
        <div className="logo p-7 border-b border-neutral-800">
          <div className="inline-flex items-center gap-3">
            <div className="w-[32px] h-[32px] bg-white rounded-lg flex items-center justify-center text-black shadow-md border border-neutral-800">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="font-['Syne'] text-[18px] font-bold tracking-tight text-white">PitchRadar</div>
              <div className="text-[10px] text-neutral-500 tracking-widest uppercase mt-0.5 font-semibold">AI Lead Engine</div>
            </div>
          </div>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] tracking-widest uppercase text-neutral-500 px-4 pt-4 pb-3 font-bold">Core</div>
          <div className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-bold transition-all mb-1 ${activePage === 'scraper' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('scraper')}>
            <Search className="w-4 h-4" /> Lead Scraper
          </div>
          <div className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-bold transition-all mb-1 ${activePage === 'leads' ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('leads')}>
            <Target className="w-4 h-4" /> All Leads
          </div>
          <div className="text-[10px] tracking-widest uppercase text-neutral-500 px-4 pt-6 pb-3 font-bold">Outreach</div>
          <div className="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white mb-1 transition-all">
            <Send className="w-4 h-4" /> Campaigns
          </div>
          <div className="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-[13px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white mb-1 transition-all">
            <BarChart2 className="w-4 h-4" /> Analytics
          </div>
        </nav>
        <div className="p-5 border-t border-neutral-800 bg-[#0c0c0c]">
          <div className="bg-[#080808] border border-neutral-800 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:border-neutral-700 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-xs text-white font-bold">Pro Plan Active</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex justify-between items-center">
              <span>{1000 - credits} / 1000 credits</span>
            </div>
            <div className="mt-2.5 h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${((1000-credits)/1000)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main ml-[240px] flex-1 min-h-screen flex flex-col">
        <div className="topbar px-10 py-5 border-b border-neutral-800 flex items-center justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="font-['Syne'] text-xl font-bold text-white tracking-tight">Lead Scraper</div>
          <div className="flex items-center gap-5">
            <div className="inline-flex items-center gap-2 text-[12px] text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> 
              Live API Connection
            </div>
            <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center text-[13px] font-bold text-black border border-neutral-800 shadow-sm cursor-pointer hover:bg-neutral-200 transition-all">AK</div>
          </div>
        </div>

        <div className="content-custom px-10 py-8 flex-1">
          {/* SEARCH HERO */}
          <div className="search-hero bg-[#0c0c0c] border border-neutral-800 rounded-[24px] p-8 mb-8 relative overflow-hidden shadow-2xl">
            
            <div className="max-w-2xl relative z-10">
              <h2 className="text-[26px] font-bold mb-2 text-white tracking-tight">Find & Pitch Any Business</h2>
              <p className="text-neutral-400 text-[15px] mb-8 leading-relaxed">Enter your target criteria below. Our engine will scrape live data, score the leads, identify digital weaknesses, and write highly personalized outreach campaigns.</p>
            </div>
            
            <div className="flex gap-4 items-end flex-wrap relative z-10">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[12px] text-neutral-500 mb-2 font-bold uppercase tracking-wider">Business Niche</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input className="w-full bg-[#080808] border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white text-[14px] outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. roofing company" />
                </div>
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[12px] text-neutral-500 mb-2 font-bold uppercase tracking-wider">Target Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input className="w-full bg-[#080808] border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white text-[14px] outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:text-neutral-600" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Texas, USA" />
                </div>
              </div>
              <div className="w-[200px]">
                <label className="block text-[12px] text-neutral-500 mb-2 font-bold uppercase tracking-wider">Your Service</label>
                <select className="w-full bg-[#080808] border border-neutral-800 rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-white focus:ring-1 focus:ring-white transition-all appearance-none cursor-pointer" value={service} onChange={e=>setService(e.target.value)}>
                  <option>Web Design</option>
                  <option>SEO & Content</option>
                  <option>Social Media</option>
                  <option>Google Ads</option>
                  <option>Email Marketing</option>
                  <option>Full Digital Marketing</option>
                </select>
              </div>
              <button onClick={handleSearch} disabled={isLoading} className="bg-white text-black px-7 py-3 rounded-xl text-[14px] font-bold flex items-center gap-2.5 hover:bg-neutral-200 transition-all h-[46px] disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                {isLoading ? 'Extracting...' : 'Extract Leads'}
              </button>
            </div>
            
            {error && <div className="mt-5 text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
          </div>

          {/* LOADING OVERLAY */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-6 bg-[#0c0c0c] border border-neutral-800 rounded-[24px]">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-neutral-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
              </div>
              <div className="font-['Syne'] text-lg font-semibold text-white tracking-wide">Processing Lead Data...</div>
              <div className="flex flex-col gap-3.5 w-full max-w-[360px] bg-[#080808] p-6 rounded-xl border border-neutral-800">
                {[
                  'Scanning business directories...', 
                  'Extracting contact information...', 
                  'Analyzing web presence...', 
                  'Running opportunity algorithms...', 
                  'Formatting final output...'
                ].map((text, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[13px] font-medium transition-colors ${loadingStep > i ? 'text-white' : loadingStep === i ? 'text-white' : 'text-neutral-600'}`}>
                    {loadingStep > i ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Loader2 className={`w-4 h-4 shrink-0 ${loadingStep === i ? 'animate-spin text-white' : ''}`} />}
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MONOCHROME ANALYTICS PANEL */}
          {results.length > 0 && !isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* STATS OVERVIEW */}
              <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[20px] p-6 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="text-[11px] text-neutral-500 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-white" /> Lead Acquisition Summary
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-neutral-500 text-xs font-semibold mb-0.5">Total Leads</div>
                      <div className="font-['Outfit'] text-[28px] font-bold text-white leading-tight">{totalLeadsCount}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-xs font-semibold mb-0.5">Avg Score</div>
                      <div className="font-['Outfit'] text-[28px] font-bold text-white leading-tight">{avgOpportunityScore}</div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-neutral-900">
                      <div className="text-neutral-500 text-xs font-semibold mb-0.5">Est. Monthly Revenue Leakage</div>
                      <div className="font-['Outfit'] text-[24px] font-bold text-white leading-tight">${totalMonthlyLoss.toLocaleString()}/mo</div>
                      <div className="text-[11px] text-neutral-500 mt-1 font-medium">Estimated niche revenue loss from conversion gaps</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPPORTUNITY DISTRIBUTION GRAPH */}
              <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[20px] p-6 shadow-lg">
                <div className="text-[11px] text-neutral-500 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-white" /> Opportunity Temperature
                </div>
                <div className="flex items-end justify-between h-[120px] px-4 pt-4 border-b border-neutral-900 relative">
                  {/* Grid Lines */}
                  <div className="absolute left-0 right-0 top-1/4 border-t border-neutral-900/50 pointer-events-none"></div>
                  <div className="absolute left-0 right-0 top-2/4 border-t border-neutral-900/50 pointer-events-none"></div>
                  <div className="absolute left-0 right-0 top-3/4 border-t border-neutral-900/50 pointer-events-none"></div>
                  
                  {/* Cold Leads Bar */}
                  <div className="flex flex-col items-center flex-1 group z-10">
                    <div className="text-[10px] text-neutral-500 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{coldLeadsCount}</div>
                    <div className="w-12 bg-neutral-800 rounded-t-md hover:bg-neutral-700 transition-colors" style={{ height: `${Math.max(4, (coldLeadsCount / (Math.max(hotLeadsCount, warmLeadsCount, coldLeadsCount) || 1)) * 80)}px` }} />
                    <span className="text-[10px] text-neutral-500 font-bold mt-2">Cold</span>
                  </div>

                  {/* Warm Leads Bar */}
                  <div className="flex flex-col items-center flex-1 group z-10">
                    <div className="text-[10px] text-neutral-400 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{warmLeadsCount}</div>
                    <div className="w-12 bg-neutral-500 rounded-t-md hover:bg-neutral-400 transition-colors" style={{ height: `${Math.max(4, (warmLeadsCount / (Math.max(hotLeadsCount, warmLeadsCount, coldLeadsCount) || 1)) * 80)}px` }} />
                    <span className="text-[10px] text-neutral-400 font-bold mt-2">Warm</span>
                  </div>

                  {/* Hot Leads Bar */}
                  <div className="flex flex-col items-center flex-1 group z-10">
                    <div className="text-[10px] text-white font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{hotLeadsCount}</div>
                    <div className="w-12 bg-white rounded-t-md hover:bg-neutral-200 transition-colors" style={{ height: `${Math.max(4, (hotLeadsCount / (Math.max(hotLeadsCount, warmLeadsCount, coldLeadsCount) || 1)) * 80)}px` }} />
                    <span className="text-[10px] text-white font-bold mt-2">Hot</span>
                  </div>
                </div>
              </div>

              {/* CRM FUNNEL PROGRESS GRAPH */}
              <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[20px] p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-neutral-500 mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-white" /> CRM Funnel Activity
                  </div>
                  <div className="flex items-center gap-6">
                    {/* SVG Donut Chart */}
                    <div className="relative w-24 h-24 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background Ring */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1c1c1f" strokeWidth="3" />
                        
                        {/* Segment 1: Contacted (Solid White) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ffffff" strokeWidth="3" 
                          strokeDasharray={`${(statusContacted / (totalLeadsCount || 1)) * 100} ${100 - (statusContacted / (totalLeadsCount || 1)) * 100}`} 
                          strokeDashoffset="0" />
                        
                        {/* Segment 2: Checked (Gray) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6c6c72" strokeWidth="3" 
                          strokeDasharray={`${(statusChecked / (totalLeadsCount || 1)) * 100} ${100 - (statusChecked / (totalLeadsCount || 1)) * 100}`} 
                          strokeDashoffset={`${-((statusContacted / (totalLeadsCount || 1)) * 100)}`} />
                        
                        {/* Segment 3: New (Dark Gray) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2a2a2f" strokeWidth="3" 
                          strokeDasharray={`${(statusNew / (totalLeadsCount || 1)) * 100} ${100 - (statusNew / (totalLeadsCount || 1)) * 100}`} 
                          strokeDashoffset={`${-(((statusContacted + statusChecked) / (totalLeadsCount || 1)) * 100)}`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[15px] font-bold text-white">{Math.round(((statusContacted + statusChecked) / (totalLeadsCount || 1)) * 100)}%</span>
                        <span className="text-[8px] text-neutral-500 uppercase font-semibold">Done</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-500">
                          <span className="w-2.5 h-2.5 rounded bg-[#2a2a2f] border border-neutral-700 inline-block"></span> New Leads
                        </span>
                        <span className="font-bold text-white">{statusNew}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-400">
                          <span className="w-2.5 h-2.5 rounded bg-[#6c6c72] inline-block"></span> Checked
                        </span>
                        <span className="font-bold text-white">{statusChecked}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-white">
                          <span className="w-2.5 h-2.5 rounded bg-white inline-block"></span> Reached Out
                        </span>
                        <span className="font-bold text-white">{statusContacted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          {results.length > 0 && !isLoading && (
            <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[20px] overflow-hidden shadow-xl">
              <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between bg-[#080808]/50 gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[16px] font-semibold text-white">Extracted Leads</h3>
                  <span className="bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-[12px] text-neutral-400 font-medium">{filteredLeads.length} total</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={exportCSV} className="bg-[#0c0c0c] border border-neutral-800 px-4 py-2 rounded-xl text-[13px] font-medium flex items-center gap-2 hover:bg-neutral-900 transition-colors text-white"><Download className="w-4 h-4"/> Export CSV</button>
                  <button className="bg-white text-black px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors"><Zap className="w-4 h-4 fill-current"/> Auto-Pitch All</button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 px-6 py-4 border-b border-neutral-800 bg-[#0c0c0c] items-start md:items-center justify-between">
                {/* Search & Filters */}
                <div className="flex gap-3 flex-wrap items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input className="bg-[#080808] border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-[13px] outline-none focus:border-white min-w-[220px] text-white placeholder:text-neutral-500 transition-colors" placeholder="Filter company name..." value={searchFilter} onChange={e=>setSearchFilter(e.target.value)} />
                  </div>
                  <select className="bg-[#080808] border border-neutral-800 rounded-lg px-4 py-2 text-[13px] outline-none text-white cursor-pointer focus:border-white transition-colors" value={scoreFilter} onChange={e=>setScoreFilter(e.target.value)}>
                    <option value="">All Scores</option>
                    <option value="hot">Hot Leads (70+)</option>
                    <option value="warm">Warm Leads (40-69)</option>
                    <option value="cold">Cold Leads (0-39)</option>
                  </select>
                  <select className="bg-[#080808] border border-neutral-800 rounded-lg px-4 py-2 text-[13px] outline-none text-white cursor-pointer focus:border-white transition-colors" value={oppFilter} onChange={e=>setOppFilter(e.target.value)}>
                    <option value="">All Opportunities</option>
                    <option value="web">Web Design Gaps</option>
                    <option value="seo">SEO/Reputation Gaps</option>
                    <option value="social">Social Media Gaps</option>
                    <option value="ads">Advertising Gaps</option>
                  </select>
                </div>

                {/* CRM Filter Tabs */}
                <div className="flex gap-1.5 bg-[#080808] p-1 rounded-lg border border-neutral-800">
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'new', label: 'New' },
                    { value: 'checked', label: 'Checked' },
                    { value: 'contacted', label: 'Reached Out' }
                  ] as const).map((tab) => {
                    const count = tab.value === 'all' 
                      ? results.length 
                      : tab.value === 'new' 
                        ? statusNew 
                        : tab.value === 'checked' 
                          ? statusChecked 
                          : statusContacted;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setCrmFilter(tab.value)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all uppercase tracking-wider ${crmFilter === tab.value ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                      >
                        {tab.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0c0c0c] border-b border-neutral-800">
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">CRM Status</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Company</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Rating</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Website</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Est. Loss</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Contact Info</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">AI Score</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Gaps</th>
                      <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-neutral-500 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l: any, i: number) => {
                      const currentStatus = leadStatuses[l.companyName] || 'new';
                      const badgeBg = currentStatus === 'contacted' ? 'bg-white text-black font-bold' : currentStatus === 'checked' ? 'bg-neutral-800 text-white' : 'bg-neutral-900/60 text-neutral-400';
                      const opportunityScoreColor = l.score >= 70 ? 'text-white' : l.score >= 40 ? 'text-neutral-400' : 'text-neutral-600';
                      
                      return (
                        <tr key={i} onClick={() => openPitchModal(l)} className="border-b border-neutral-900 hover:bg-neutral-950/60 cursor-pointer transition-colors group">
                          {/* CRM STATUS Dropdown/Toggle */}
                          <td className="px-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={currentStatus} 
                              onChange={(e) => updateLeadStatus(l.companyName, e.target.value as any)}
                              className={`border border-neutral-800 text-[10px] font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-white transition-all uppercase tracking-wider ${badgeBg}`}
                            >
                              <option value="new">🆕 New</option>
                              <option value="checked">👁️ Checked</option>
                              <option value="contacted">✉️ Reached Out</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="font-bold text-[14px] text-white group-hover:underline transition-colors">{l.companyName}</div>
                            <div className="text-[12px] text-neutral-500 mt-1 font-medium">{l.category} · {l.city}</div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[12px] font-medium text-white">
                              <Star className={`w-3.5 h-3.5 ${l.rating >= 4.0 ? 'text-white fill-white' : 'text-neutral-500'}`}/> 
                              {l.rating > 0 ? `${l.rating} (${l.reviews})` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            {l.website !== 'N/A' ? (
                              <a href={l.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-neutral-400 hover:text-white flex items-center gap-1.5 text-[12px] font-medium transition-colors underline">
                                <Globe className="w-3.5 h-3.5" /> Visit Site
                              </a>
                            ) : (
                              <span className="flex items-center gap-1.5 text-neutral-500 text-[12px] font-semibold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-905"><XCircle className="w-3.5 h-3.5"/> Missing</span>
                            )}
                          </td>
                          <td className="px-6 py-4 align-middle font-['Outfit'] text-[13px] font-bold text-neutral-400">
                            {l.monthlyLoss ? `-$${l.monthlyLoss.toLocaleString()}/mo` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 align-middle text-[12px] text-neutral-400">
                            <div className="flex flex-col gap-1.5">
                              {l.phone !== 'N/A' && <span className="flex items-center gap-2 font-medium"><Phone className="w-3.5 h-3.5 text-neutral-600"/> {l.phone}</span>}
                              {l.email && l.email !== 'N/A' && <span className="flex items-center gap-2 text-white font-medium"><Mail className="w-3.5 h-3.5 text-neutral-600"/> {l.email}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-2 w-20">
                              <span className={`text-[14px] font-bold ${opportunityScoreColor}`}>{l.score}</span>
                              <div className="flex-1 h-1 bg-neutral-900 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${l.score}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex gap-1 flex-wrap">
                              {l.opps.map((o: string) => {
                                const badges: any = { 
                                  web: { label: 'Web', class: 'bg-neutral-900 text-neutral-300 border-neutral-800' }, 
                                  seo: { label: 'SEO', class: 'bg-neutral-900 text-neutral-300 border-neutral-800' }, 
                                  social: { label: 'Social', class: 'bg-neutral-900 text-neutral-300 border-neutral-800' }, 
                                  ads: { label: 'Ads', class: 'bg-neutral-900 text-neutral-300 border-neutral-800' }, 
                                  email: { label: 'Email', class: 'bg-neutral-900 text-neutral-300 border-neutral-800' } 
                                };
                                const Badge = badges[o];
                                if (!Badge) return null;
                                return (
                                  <span key={o} className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${Badge.class}`}>
                                    {Badge.label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <button onClick={(e) => { e.stopPropagation(); openPitchModal(l); }} className="bg-neutral-900 border border-neutral-800 text-white px-3.5 py-1.5 rounded-lg text-[12px] font-bold hover:bg-white hover:text-black hover:border-white transition-all inline-flex items-center gap-1.5 ml-auto">
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
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-[#0c0c0c] border border-neutral-800 rounded-[24px] w-full max-w-[800px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-start bg-[#050505]/30">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight">{currentLead.companyName}</h3>
                  <div className="flex items-center gap-3 text-[13px] text-neutral-400 mt-1.5 font-semibold flex-wrap">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-neutral-500"/> {currentLead.city}</span>
                    <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                    <span className="flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5 text-neutral-500"/> {currentLead.category}</span>
                    <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-neutral-500">Status:</span>
                      <select 
                        value={leadStatuses[currentLead.companyName] || 'new'}
                        onChange={(e) => updateLeadStatus(currentLead.companyName, e.target.value as any)}
                        className="bg-neutral-950 border border-neutral-800 text-white text-[11px] font-bold px-2 py-0.5 rounded outline-none cursor-pointer focus:border-white focus:ring-1 focus:ring-white"
                      >
                        <option value="new">New</option>
                        <option value="checked">Checked</option>
                        <option value="contacted">Contacted</option>
                      </select>
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex gap-1.5 mb-8 bg-[#080808] rounded-xl p-1.5 border border-neutral-800">
                <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] rounded-lg font-semibold transition-all ${activeTab === 'analysis' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}><BarChart2 className="w-3.5 h-3.5"/> Diagnostic</button>
                <button onClick={() => { setActiveTab('reviews'); fetchReviews(currentLead); }} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] rounded-lg font-semibold transition-all ${activeTab === 'reviews' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}><Star className="w-3.5 h-3.5"/> Reviews</button>
                <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] rounded-lg font-semibold transition-all ${activeTab === 'contacts' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}><Users className="w-3.5 h-3.5"/> Contacts</button>
                <button onClick={() => { setActiveTab('pitch'); if (!pitchContent) generatePitch(); }} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] rounded-lg font-semibold transition-all ${activeTab === 'pitch' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}><Mail className="w-3.5 h-3.5"/> AI Pitch</button>
                <button onClick={() => setActiveTab('opportunities')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[12px] rounded-lg font-semibold transition-all ${activeTab === 'opportunities' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}><Target className="w-3.5 h-3.5"/> Plan</button>
              </div>

              {/* TAB CONTENT: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[15px] font-bold text-white tracking-tight">Key Decision Makers</h4>
                    {!currentLead.enriched && (
                      <button onClick={handleEnrichLead} disabled={enriching} className="bg-white text-black px-4 py-2 rounded-lg text-[12px] font-bold flex items-center gap-2 hover:bg-neutral-200 disabled:opacity-50 transition-all">
                        {enriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {enriching ? 'Enriching...' : 'Deep Search (10 Credits)'}
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-6 mb-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                    {enriching && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <span className="text-[12px] font-semibold text-white tracking-wide">Scraping LinkedIn & Meta Ads...</span>
                      </div>
                    )}
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-white text-black border border-neutral-850 flex items-center justify-center text-[20px] font-bold shrink-0 shadow-lg ring-4 ring-white/10">
                        {currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-white tracking-tight">{currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker : 'Unknown Contact'}</div>
                        <div className="text-[13px] text-neutral-400 font-medium mt-0.5">{currentLead.title || 'Owner / Founder'}</div>
                        <div className="flex items-center gap-3 mt-2">
                          {currentLead.directEmail !== 'N/A' && <div className="text-[12px] text-neutral-300 flex items-center gap-1.5 font-semibold bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800"><Mail className="w-3.5 h-3.5 text-neutral-500"/> {currentLead.directEmail}</div>}
                          {currentLead.linkedinUrl && currentLead.linkedinUrl !== 'N/A' && (
                            <a href={currentLead.linkedinUrl} target="_blank" rel="noreferrer" className="text-[12px] text-neutral-300 flex items-center gap-1.5 font-semibold bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800 hover:bg-neutral-800"><Network className="w-3.5 h-3.5 text-neutral-500"/> LinkedIn Profile</a>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentLead.enriched ? (
                      <span className="bg-neutral-900 text-white border border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Fully Enriched</span>
                    ) : currentLead.decisionMaker !== 'N/A' ? (
                      <span className="bg-neutral-900 text-white border border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>
                    ) : (
                      <span className="bg-neutral-900 text-neutral-400 border border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Needs Enrichment</span>
                    )}
                  </div>

                  {currentLead.enriched && (
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-[#080808] border border-neutral-800 rounded-xl p-4">
                        <div className="text-[12px] uppercase tracking-wider text-neutral-500 mb-2 font-bold flex items-center gap-2"><Activity className="w-4 h-4"/> Meta Ads</div>
                        <div className="text-[14px] font-bold text-white">
                          {currentLead.hasActiveAds ? 'Active Campaigns Found' : 'No Active Ads'}
                        </div>
                      </div>
                      <div className="bg-[#080808] border border-neutral-800 rounded-xl p-4">
                        <div className="text-[12px] uppercase tracking-wider text-neutral-500 mb-2 font-bold flex items-center gap-2"><Network className="w-4 h-4"/> Network Match</div>
                        <div className="text-[14px] font-bold text-white">Profile Identified</div>
                      </div>
                    </div>
                  )}

                  {!currentLead.enriched && (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-[13px] text-neutral-400 leading-relaxed flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-white shrink-0 mt-0.5"/>
                      <p>Run a <strong className="text-white">Deep Search</strong> to orchestrate LinkedIn and Meta Ads scrapers specifically for this prospect. This will consume 10 credits due to compute intensity.</p>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {reviewsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-white"/>
                      <p className="text-[14px] font-semibold">Fetching reviews from Google Maps...</p>
                    </div>
                  ) : reviewsData?.stats ? (
                    <div>
                      <div className="flex gap-4 mb-5">
                        <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex-1 text-center">
                          <div className="text-[36px] font-bold text-white">{reviewsData.stats.average}</div>
                          <div className="flex justify-center gap-0.5 mt-1 mb-2">{[1,2,3,4,5].map((s: number) => <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsData.stats.average) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-neutral-600'}`}/>)}</div>
                          <div className="text-[12px] text-neutral-400">{reviewsData.stats.total} reviews</div>
                        </div>
                        <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex-[2]">
                          <h4 className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-3">Rating Distribution</h4>
                          {[5,4,3,2,1].map((star: number) => {
                            const count = reviewsData.stats.distribution[star-1] || 0;
                            const pct = reviewsData.stats.total ? Math.round((count / reviewsData.stats.total) * 100) : 0;
                            return (<div key={star} className="flex items-center gap-2 mb-1.5"><span className="text-[12px] text-neutral-450 w-4 font-bold">{star}</span><Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]"/><div className="flex-1 h-2 bg-black border border-neutral-900 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: star >= 4 ? '#22c55e' : star === 3 ? '#f59e0b' : '#ef4444' }}></div></div><span className="text-[11px] text-neutral-400 w-8 text-right font-medium">{count}</span></div>);
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center"><div className="text-[20px] font-bold text-white">{reviewsData.stats.positive}</div><div className="text-[11px] text-neutral-400 font-semibold mt-1">Positive</div></div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center"><div className="text-[20px] font-bold text-neutral-400">{reviewsData.stats.neutral}</div><div className="text-[11px] text-neutral-405 font-semibold mt-1">Neutral</div></div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center"><div className="text-[20px] font-bold text-neutral-500">{reviewsData.stats.negative}</div><div className="text-[11px] text-neutral-410 font-semibold mt-1">Negative</div></div>
                      </div>
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 mb-5">
                        <div className="flex justify-between mb-3"><h4 className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Owner Response Rate</h4><span className="text-[13px] font-bold text-white">{reviewsData.stats.responseRate}%</span></div>
                        <div className="h-2 bg-black border border-neutral-900 rounded-full overflow-hidden"><div className="h-full rounded-full bg-white" style={{ width: `${reviewsData.stats.responseRate}%` }}></div></div>
                      </div>
                      {reviewsData.reviews?.length > 0 && (<div className="space-y-3 max-h-[250px] overflow-y-auto">{reviewsData.reviews.slice(0, 10).map((r: any, i: number) => (<div key={i} className="bg-[#080808] border border-neutral-800 rounded-xl p-4"><div className="flex items-center justify-between mb-2"><span className="text-[13px] font-semibold text-white">{r.author}</span><div className="flex gap-0.5">{[1,2,3,4,5].map((s: number) => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-neutral-600'}`}/>)}</div></div>{r.text && <p className="text-[12px] text-neutral-400 leading-relaxed line-clamp-3">{r.text}</p>}</div>))}</div>)}
                    </div>
                  ) : (<div className="text-center py-16 text-neutral-400"><Star className="w-10 h-10 mx-auto mb-3 text-neutral-600"/><p className="text-[14px] font-semibold">Click to load reviews</p></div>)}
                </div>
              )}

              {/* DIAGNOSTIC TAB */}
              {activeTab === 'analysis' && (() => {
                const sa = currentLead.siteAnalysis || {};
                const sc = currentLead.scoring || {};
                const bd = sc.breakdown || {};
                const rev = sc.revenue || {};
                return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* SCORE + REVENUE HEADER */}
                  <div className="flex gap-4 mb-5">
                    <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Opportunity Score</div>
                      <div className="text-[36px] font-bold tracking-tight text-white">{currentLead.score}<span className="text-[16px] text-neutral-500">/99</span></div>
                      <div className="text-[12px] font-bold mt-1 text-white">{sc.classification || 'WARM'}</div>
                    </div>
                    <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Est. Revenue Loss</div>
                      <div className="text-[28px] font-bold text-white tracking-tight">${(rev.estimatedMonthlyLoss || 0).toLocaleString()}<span className="text-[14px] text-neutral-500">/mo</span></div>
                      <div className="text-[12px] text-neutral-400 mt-1">~{rev.lostLeadsPerMonth || 0} leads lost monthly</div>
                    </div>
                    <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-2">Deal Value</div>
                      <div className="text-[16px] font-bold text-white tracking-tight mt-2">{rev.estimatedDealValue || 'N/A'}</div>
                      <div className="text-[12px] text-neutral-400 mt-1">Best pitch: {rev.topService || 'Web Design'}</div>
                    </div>
                  </div>

                  {/* 8-CATEGORY BREAKDOWN */}
                  <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 mb-5">
                    <h4 className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mb-4">Weighted Scoring Breakdown</h4>
                    <div className="space-y-3">
                      {Object.values(bd).map((cat: any, i: number) => {
                        return (<div key={i} className="flex items-center gap-3"><span className="text-[12px] text-neutral-400 font-medium w-[140px] shrink-0">{cat.label}</span><div className="flex-1 h-2 bg-black border border-neutral-900 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700 bg-white" style={{ width: `${cat.score}%` }}></div></div><span className="text-[12px] font-bold w-10 text-right text-white">{cat.score}%</span><span className="text-[10px] text-neutral-500 w-6">×{cat.weight}</span></div>);
                      })}
                    </div>
                  </div>
                  {/* TECH ROW */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="bg-[#080808] border border-neutral-800 rounded-xl p-3 text-center"><div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">Platform</div><div className="text-[13px] font-bold text-white">{sa.cms || 'N/A'}</div></div>
                    <div className="bg-[#080808] border border-neutral-800 rounded-xl p-3 text-center"><div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">Speed</div><div className="text-[13px] font-bold text-white">{sa.loadTime ? `${(sa.loadTime/1000).toFixed(1)}s` : 'N/A'}</div></div>
                    <div className="bg-[#080808] border border-neutral-800 rounded-xl p-3 text-center"><div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">SSL</div><div className="text-[13px] font-bold text-white">{sa.ssl ? 'Secure' : 'None'}</div></div>
                    <div className="bg-[#080808] border border-neutral-800 rounded-xl p-3 text-center"><div className="text-[10px] uppercase text-neutral-500 font-bold mb-1">SEO</div><div className="text-[13px] font-bold text-white">{sa.seoScore || 0}/100</div></div>
                  </div>
                  {/* QUICK CHECKS */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Analytics', ok: sa.analytics?.length > 0, val: sa.analytics?.join(', ') || 'None' },
                      { label: 'Ad Pixels', ok: sa.pixels?.length > 0, val: sa.pixels?.join(', ') || 'None' },
                      { label: 'Lead Forms', ok: sa.conversion?.hasForm, val: sa.conversion?.hasForm ? 'Detected' : 'Missing' },
                      { label: 'Live Chat', ok: sa.conversion?.hasChat || sa.conversion?.hasWhatsapp, val: sa.conversion?.hasChat ? 'Active' : sa.conversion?.hasWhatsapp ? 'WhatsApp' : 'None' },
                      { label: 'Booking', ok: sa.conversion?.hasBooking, val: sa.conversion?.hasBooking ? 'Active' : 'None' },
                      { label: 'Testimonials', ok: sa.conversion?.hasTestimonials, val: sa.conversion?.hasTestimonials ? 'Found' : 'Missing' },
                      { label: 'Blog', ok: sa.seo?.hasBlog, val: sa.seo?.hasBlog ? 'Active' : 'None' },
                      { label: 'AI Ready (AEO)', ok: (sa.aeo?.score || 0) >= 40, val: `${sa.aeo?.score || 0}/100` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#080808] border border-neutral-800 rounded-xl px-4 py-2.5"><span className="text-[12px] text-neutral-400 font-medium">{item.label}</span><span className={`text-[12px] font-bold flex items-center gap-1.5 ${item.ok ? 'text-white' : 'text-neutral-500'}`}>{item.ok ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>} {item.val}</span></div>
                    ))}
                  </div>
                  {/* VULNERABILITIES */}
                  {sa.opportunities?.length > 0 && (
                    <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 mb-5">
                      <h4 className="text-[11px] uppercase tracking-wider text-neutral-500 mb-3 font-bold">Vulnerabilities</h4>
                      <div className="flex flex-wrap gap-2">{sa.opportunities.map((opp: string, i: number) => (<span key={i} className="bg-neutral-900 border border-neutral-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-neutral-400"/> {opp}</span>))}</div>
                    </div>
                  )}
                  {/* AI STRATEGIC ANALYSIS */}
                  <div className="bg-neutral-900 border-l-4 border-white rounded-r-xl p-5 text-[13px] text-neutral-400 leading-relaxed flex gap-4">
                    <Sparkles className="w-6 h-6 text-white shrink-0"/>
                    <div>
                      <strong className="text-white block mb-1">AI Strategic Analysis</strong>
                      {currentLead.companyName} {sa.exists ? `uses ${sa.cms || 'unknown CMS'}` : 'has no website'}. Estimated <strong className="text-white">${(rev.estimatedMonthlyLoss || 0).toLocaleString()}/mo</strong> revenue leakage from {rev.lostLeadsPerMonth || 0} lost leads. Best service to pitch: <strong className="text-white">{rev.topService || 'Web Design'}</strong>. Classification: <strong className="text-white">{sc.classification}</strong>.
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* TAB CONTENT: PITCH */}
              {activeTab === 'pitch' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[#080808] border border-neutral-800 rounded-xl p-4 text-[13px] mb-5 flex items-center gap-3">
                    <div className="bg-neutral-900 border border-neutral-800 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">Subject</div>
                    <span className="font-medium text-white">{pitchSubject || 'Analyzing parameters...'}</span>
                  </div>
                  <div className={`bg-[#080808] border border-neutral-800 rounded-[16px] p-6 text-[14px] leading-loose whitespace-pre-wrap font-medium shadow-inner ${pitchLoading ? 'text-neutral-500 animate-pulse flex items-center justify-center min-h-[200px]' : 'text-neutral-300'}`}>
                    {pitchLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                        Generating personalized copy...
                      </div>
                    ) : pitchContent}
                  </div>
                  {!pitchLoading && (
                    <div className="flex justify-end mt-5">
                      <button onClick={copyPitch} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border ${pitchCopied ? 'bg-white text-black border-white' : 'bg-[#080808] text-white border-neutral-800 hover:bg-white hover:text-black hover:border-white'}`}>
                        {pitchCopied ? <><CheckCircle2 className="w-4 h-4"/> Copied & Marked Contacted</> : <><Copy className="w-4 h-4"/> Copy & Mark Contacted</>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: OPPORTUNITIES */}
              {activeTab === 'opportunities' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white"/>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-white tracking-tight">Identified Conversion Gaps</h4>
                      <div className="text-[13px] text-neutral-400 font-medium">Found {currentLead.opps.length} measurable deficiencies for {service} solutions.</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {currentLead.opps.includes('web') && (
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Deploy Dedicated Infrastructure 
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1"><Flame className="w-3 h-3 text-neutral-400"/> High Impact</span>
                          </div>
                          <div className="text-[13px] text-neutral-400 leading-relaxed font-medium">Target lacks primary domain routing. Current prospective traffic experiences 100% bounce rate at discovery phase. Implementing optimized architecture yields immediate lead capture capability.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('seo') && (
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Reputation Recovery Protocol
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1"><Flame className="w-3 h-3 text-neutral-400"/> High Impact</span>
                          </div>
                          <div className="text-[13px] text-neutral-400 leading-relaxed font-medium">Aggregate score ({currentLead.rating}★) sits below the algorithmic trust threshold. Implementing review gating and response automation will normalize metrics within current quarter.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('social') && (
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Social Channel Activation
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3 text-neutral-400"/> Med Impact</span>
                          </div>
                          <div className="text-[13px] text-neutral-400 leading-relaxed font-medium">Zero presence detected on high-velocity discovery networks. Initiating content syndication will capture local organic search volume currently lost to competitors.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('ads') && (
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Paid Traffic & Retargeting Setup
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3 text-neutral-400"/> Med Impact</span>
                          </div>
                          <div className="text-[13px] text-neutral-400 leading-relaxed font-medium">No tracking pixels or active campaigns detected. Setting up Google Ads and Facebook Retargeting pixels will capture high-intent buyers searching for local services.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('email') && (
                      <div className="bg-[#080808] border border-neutral-800 rounded-[16px] p-5 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-white mb-1.5 flex items-center gap-2">
                            Direct Outreach Campaign
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-white font-bold uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3 text-neutral-400"/> Med Impact</span>
                          </div>
                          <div className="text-[13px] text-neutral-400 leading-relaxed font-medium">Missing direct point of contact. Cold outreach sequence targeting generic inboxes needs transition to personalized decision-maker campaigns to increase response rate.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-neutral-800 flex gap-3 justify-end bg-[#050505]/50">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#080808] border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all">Dismiss</button>
              <button onClick={() => { setActiveTab('pitch'); generatePitch(); }} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-neutral-900 border border-neutral-800 text-white hover:bg-white hover:text-black hover:border-white transition-all flex items-center gap-2"><Sparkles className="w-4 h-4"/> Regenerate Sequence</button>
              <button onClick={() => alert('📤 Enterprise Outreach Module locked in Demo Mode')} className="px-5 py-2.5 rounded-xl text-[13px] font-bold bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-2 border border-neutral-800"><Send className="w-4 h-4"/> Initiate Outreach</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
