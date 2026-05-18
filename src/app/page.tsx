"use client";

import { useState } from "react";
import { Search, Loader2, Download, CheckCircle2, XCircle, AlertTriangle, Copy, Send, Sparkles, Target } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("analysis"); // 'analysis', 'pitch', 'opportunities'
  const [pitchContent, setPitchContent] = useState("");
  const [pitchSubject, setPitchSubject] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);

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
      // Simulate steps
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
    
    // Simulate API delay for prototype
    setTimeout(() => {
      const l = currentLead;
      const noSiteStr = "You don't currently have a website — which means potential customers who find you on Google have no way to learn more, see your work, or contact you online.";
      const ratingStr = `Your Google rating of ${l.rating}★ and limited online presence is likely sending customers to your competitors.`;
      
      const subject = `Helping ${l.companyName} get more customers online`;
      const body = `Hi [Owner Name],\n\nI came across ${l.companyName} on Google and noticed something that might be costing you customers.\n\n${l.website === 'N/A' ? noSiteStr : ratingStr}\n\nI help ${l.category.toLowerCase()}s like yours get more leads through ${service}. I'd love to share some specific ideas for your business — no cost, no pressure.\n\nWould a 15-min call this week work?\n\nBest,\n[Your Name]`;
      
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

  return (
    <div className="flex bg-[#09090f] min-h-screen text-[#f0f0f8] font-sans">
      {/* SIDEBAR */}
      <div className="sidebar fixed left-0 top-0 bottom-0 w-[220px] bg-[#111118] border-r border-white/5 flex flex-col z-[100]">
        <div className="logo p-6 border-b border-white/5">
          <div className="inline-flex items-center gap-2">
            <div className="w-[30px] h-[30px] bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] rounded-lg flex items-center justify-center text-sm">⚡</div>
            <div>
              <div className="font-['Syne'] text-[17px] font-bold tracking-tight">PitchRadar</div>
              <div className="text-[10px] text-[#8888a0] tracking-widest uppercase mt-0.5">AI Lead Engine</div>
            </div>
          </div>
        </div>
        <nav className="p-4 flex-1">
          <div className="text-[10px] tracking-widest uppercase text-[#5a5a72] px-3 pt-4 pb-2">Core</div>
          <div className={`nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all mb-0.5 ${activePage === 'scraper' ? 'bg-[#4f6ef7]/10 text-[#4f6ef7] font-medium' : 'text-[#8888a0] hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('scraper')}>
            <Search className="w-[17px] h-[17px]" /> Lead Scraper
          </div>
          <div className={`nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all mb-0.5 ${activePage === 'leads' ? 'bg-[#4f6ef7]/10 text-[#4f6ef7] font-medium' : 'text-[#8888a0] hover:bg-white/5 hover:text-white'}`} onClick={() => setActivePage('leads')}>
            <Target className="w-[17px] h-[17px]" /> All Leads
          </div>
          <div className="text-[10px] tracking-widest uppercase text-[#5a5a72] px-3 pt-4 pb-2">Outreach</div>
          <div className="nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-[#8888a0] hover:bg-white/5 hover:text-white mb-0.5">
            <Send className="w-[17px] h-[17px]" /> Campaigns
          </div>
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="bg-[#4f6ef7]/10 border border-[#4f6ef7]/20 rounded-xl p-3">
            <div className="text-xs text-[#4f6ef7] font-semibold">⚡ Pro Plan</div>
            <div className="text-[11px] text-[#8888a0] mt-0.5">{1000 - credits} / 1000 credits used</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main ml-[220px] flex-1 min-h-screen">
        <div className="topbar px-8 py-[18px] border-b border-white/5 flex items-center justify-between bg-[#09090f] sticky top-0 z-50">
          <div className="font-['Syne'] text-xl font-bold">Lead Scraper</div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#22c55e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span> Live API Active
            </div>
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center text-[13px] font-bold cursor-pointer">AK</div>
          </div>
        </div>

        <div className="content-custom px-8 py-7">
          {/* SEARCH HERO */}
          <div className="search-hero bg-[#111118] border border-white/5 rounded-[20px] p-7 mb-7 relative overflow-hidden">
            <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(79,110,247,0.12)_0%,transparent_70%)] pointer-events-none" />
            <h2 className="text-[22px] font-bold mb-1.5">Find & Pitch Any Business — Instantly</h2>
            <p className="text-[#8888a0] text-sm mb-6">Enter a niche and location. Our AI scrapes live data, scores each lead, finds weaknesses, and writes a custom pitch.</p>
            
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[12px] text-[#8888a0] mb-[7px] font-medium tracking-[0.3px]">Business Niche</label>
                <input className="w-full bg-[#16161f] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-[#4f6ef7] transition-colors" value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. roofing company" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[12px] text-[#8888a0] mb-[7px] font-medium tracking-[0.3px]">Location</label>
                <input className="w-full bg-[#16161f] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-[#4f6ef7] transition-colors" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Texas, USA" />
              </div>
              <div className="w-[180px]">
                <label className="block text-[12px] text-[#8888a0] mb-[7px] font-medium tracking-[0.3px]">Your Service</label>
                <select className="w-full bg-[#16161f] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-[#4f6ef7] transition-colors" value={service} onChange={e=>setService(e.target.value)}>
                  <option>Web Design</option>
                  <option>SEO & Content</option>
                  <option>Social Media</option>
                  <option>Google Ads</option>
                  <option>Full Digital Marketing</option>
                </select>
              </div>
              <button onClick={handleSearch} disabled={isLoading} className="bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                Extract Leads
              </button>
            </div>
            
            {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

            <div className="flex gap-2 flex-wrap mt-4">
              {['Web Design', 'SEO & Content', 'Social Media', 'Google Ads', 'Email Marketing'].map(s => (
                <div key={s} onClick={() => setService(s)} className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all border ${service === s ? 'bg-[#4f6ef7]/10 border-[#4f6ef7]/30 text-[#4f6ef7]' : 'bg-[#16161f] border-white/5 text-[#8888a0] hover:bg-[#4f6ef7]/10 hover:text-[#4f6ef7]'}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* LOADING OVERLAY */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-[60px] gap-5">
              <div className="w-9 h-9 border-4 border-white/5 border-t-[#4f6ef7] rounded-full animate-spin" />
              <div className="font-['Syne'] text-base font-semibold">Scraping & Analyzing Leads...</div>
              <div className="flex flex-col gap-2.5 w-full max-w-[340px]">
                {['Scanning Google Maps...', 'Verifying phone numbers...', 'Analyzing websites...', 'Running AI opportunity scoring...', 'Building pitch data...'].map((text, i) => (
                  <div key={i} className={`flex items-center gap-2.5 text-[13px] ${loadingStep > i ? 'text-[#22c55e]' : loadingStep === i ? 'text-white' : 'text-[#8888a0]'}`}>
                    {loadingStep > i ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className={`w-4 h-4 ${loadingStep === i ? 'animate-spin' : ''}`} />}
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATS */}
          {results.length > 0 && !isLoading && (
            <div className="grid grid-cols-4 gap-3.5 mb-6">
              <div className="bg-[#111118] border border-white/5 rounded-[14px] p-4">
                <div className="text-[12px] text-[#8888a0] mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Total Leads</div>
                <div className="font-['Syne'] text-[26px] font-bold">{results.length}</div>
                <div className="text-[12px] text-[#22c55e] mt-1">↑ from live scrape</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[14px] p-4">
                <div className="text-[12px] text-[#8888a0] mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Hot Leads (Score 70+)</div>
                <div className="font-['Syne'] text-[26px] font-bold">{results.filter(l => l.score >= 70).length}</div>
                <div className="text-[12px] text-[#22c55e] mt-1">Ready to pitch now</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[14px] p-4">
                <div className="text-[12px] text-[#8888a0] mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> No / Bad Website</div>
                <div className="font-['Syne'] text-[26px] font-bold">{results.filter(l => l.website === 'N/A').length}</div>
                <div className="text-[12px] text-[#f59e0b] mt-1">Prime web design leads</div>
              </div>
              <div className="bg-[#111118] border border-white/5 rounded-[14px] p-4">
                <div className="text-[12px] text-[#8888a0] mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Avg Opportunity Score</div>
                <div className="font-['Syne'] text-[26px] font-bold">{Math.round(results.reduce((a,b)=>a+b.score,0)/results.length) || 0}</div>
                <div className="text-[12px] text-[#22c55e] mt-1">Out of 100</div>
              </div>
            </div>
          )}

          {/* TABLE */}
          {results.length > 0 && !isLoading && (
            <div className="bg-[#111118] border border-white/5 rounded-[14px] overflow-hidden">
              <div className="p-[18px] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[15px] font-semibold">Scraped Leads</h3>
                  <span className="bg-[#16161f] border border-white/5 rounded-md px-2 py-0.5 text-xs text-[#8888a0]">{filteredLeads.length} leads</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportCSV} className="bg-[#16161f] border border-white/5 px-3.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 hover:bg-[#09090f] transition-colors"><Download className="w-3.5 h-3.5"/> Export CSV</button>
                  <button className="bg-[#4f6ef7]/10 border border-[#4f6ef7]/25 text-[#4f6ef7] px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5">⚡ AI Pitch All</button>
                </div>
              </div>
              
              <div className="flex gap-2 px-[22px] py-3.5 border-b border-white/5 flex-wrap">
                <input className="bg-[#16161f] border border-white/5 rounded-lg px-3 py-1.5 text-[13px] outline-none min-w-[180px]" placeholder="🔍 Filter leads..." value={searchFilter} onChange={e=>setSearchFilter(e.target.value)} />
                <select className="bg-[#16161f] border border-white/5 rounded-lg px-3 py-1.5 text-[13px] outline-none" value={scoreFilter} onChange={e=>setScoreFilter(e.target.value)}>
                  <option value="">All Scores</option>
                  <option value="hot">Hot (70+)</option>
                  <option value="warm">Warm (40-69)</option>
                  <option value="cold">Cold (0-39)</option>
                </select>
                <select className="bg-[#16161f] border border-white/5 rounded-lg px-3 py-1.5 text-[13px] outline-none" value={oppFilter} onChange={e=>setOppFilter(e.target.value)}>
                  <option value="">All Opportunities</option>
                  <option value="web">Web Design</option>
                  <option value="seo">SEO</option>
                  <option value="social">Social Media</option>
                  <option value="ads">Google Ads</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#16161f] border-b border-white/5">
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Business</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Rating</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Website</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Contact</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">AI Score</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Opportunities</th>
                      <th className="px-[18px] py-[11px] text-[11px] uppercase tracking-wide text-[#8888a0] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l: any, i: number) => {
                      const color = l.score >= 70 ? '#22c55e' : l.score >= 40 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={i} onClick={() => openPitchModal(l)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                          <td className="px-[18px] py-[13px] align-middle">
                            <div className="font-medium text-[14px]">{l.companyName}</div>
                            <div className="text-[12px] text-[#8888a0] mt-0.5">{l.category} · {l.city}</div>
                          </td>
                          <td className="px-[18px] py-[13px] align-middle">
                            <span className="inline-flex items-center gap-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-md px-2 py-0.5 text-[12px] text-[#f59e0b] font-medium">
                              ⭐ {l.rating} ({l.reviews})
                            </span>
                          </td>
                          <td className="px-[18px] py-[13px] align-middle">
                            {l.website !== 'N/A' ? (
                              <a href={l.website} target="_blank" rel="noopener noreferrer" className="text-[#4f6ef7] hover:underline flex items-center gap-1.5 text-[12px] font-medium">
                                🌐 Visit Site
                              </a>
                            ) : (
                              <span className="text-[#ef4444] text-[12px]">❌ No website</span>
                            )}
                          </td>
                          <td className="px-[18px] py-[13px] align-middle text-[12px] text-[#8888a0]">
                            <div className="flex flex-col gap-1">
                              {l.phone !== 'N/A' && <span className="flex items-center gap-1.5">📞 {l.phone}</span>}
                              {l.email && l.email !== 'N/A' && <span className="flex items-center gap-1.5 text-white">✉️ {l.email}</span>}
                            </div>
                          </td>
                          <td className="px-[18px] py-[13px] align-middle">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-[#16161f] rounded-full overflow-hidden max-w-[70px]">
                                <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: color }}></div>
                              </div>
                              <span className="text-[12px] font-semibold" style={{ color }}>{l.score}</span>
                            </div>
                          </td>
                          <td className="px-[18px] py-[13px] align-middle">
                            <div className="flex gap-1 flex-wrap">
                              {l.opps.map((o: string) => {
                                const labels: any = { web: '🌐 Web', seo: '🔍 SEO', social: '📱 Social', ads: '📢 Ads', email: '📧 Email' };
                                const colors: any = { web: 'bg-[#4f6ef7]/10 text-[#7c9bff] border-[#4f6ef7]/15', seo: 'bg-[#22c55e]/10 text-[#4ade80] border-[#22c55e]/15', social: 'bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/15', ads: 'bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/15', email: 'bg-[#ec4899]/10 text-[#f472b6] border-[#ec4899]/15' };
                                return <span key={o} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors[o]}`}>{labels[o]}</span>;
                              })}
                            </div>
                          </td>
                          <td className="px-[18px] py-[13px] align-middle">
                            <button onClick={(e) => { e.stopPropagation(); openPitchModal(l); }} className="bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] text-white px-3 py-1.5 rounded-md text-[12px] font-semibold hover:opacity-85 transition-opacity">✨ AI Pitch</button>
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
            <div className="text-center p-[80px] text-[#8888a0]">
              <div className="text-[48px] mb-4">🎯</div>
              <h3 className="font-['Syne'] text-xl text-white mb-2">Ready to find leads</h3>
              <p className="text-sm">Enter a business niche and location above.<br/>Our AI will scrape, score, and build pitches — automatically.</p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL */}
      {modalOpen && currentLead && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-5 backdrop-blur-[4px]" onClick={() => setModalOpen(false)}>
          <div className="bg-[#111118] border border-white/10 rounded-[20px] w-full max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <h3 className="text-[18px] font-bold m-0">{currentLead.companyName}</h3>
                <p className="text-[13px] text-[#8888a0] mt-1">{currentLead.city} · {currentLead.category}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="bg-[#16161f] border border-white/5 w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[#8888a0] hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-1 mb-4 bg-[#16161f] rounded-lg p-1">
                <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2 text-center text-[13px] rounded-md font-medium transition-colors ${activeTab === 'analysis' ? 'bg-[#111118] text-white shadow-sm' : 'text-[#8888a0]'}`}>📊 Site Analysis</button>
                <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-2 text-center text-[13px] rounded-md font-medium transition-colors ${activeTab === 'contacts' ? 'bg-[#111118] text-white shadow-sm' : 'text-[#8888a0]'}`}>👥 Contacts</button>
                <button onClick={() => { setActiveTab('pitch'); if (!pitchContent) generatePitch(); }} className={`flex-1 py-2 text-center text-[13px] rounded-md font-medium transition-colors ${activeTab === 'pitch' ? 'bg-[#111118] text-white shadow-sm' : 'text-[#8888a0]'}`}>✉️ AI Pitch</button>
                <button onClick={() => setActiveTab('opportunities')} className={`flex-1 py-2 text-center text-[13px] rounded-md font-medium transition-colors ${activeTab === 'opportunities' ? 'bg-[#111118] text-white shadow-sm' : 'text-[#8888a0]'}`}>🎯 Opportunities</button>
              </div>

              {/* TAB CONTENT: CONTACTS */}
              {activeTab === 'contacts' && (
                <div>
                  <h4 className="text-[14px] font-semibold mb-3">Decision Makers & Contacts</h4>
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center text-[16px] font-bold text-white shrink-0">
                        {currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-white">{currentLead.decisionMaker !== 'N/A' ? currentLead.decisionMaker : 'Unknown Contact'}</div>
                        <div className="text-[13px] text-[#8888a0]">Owner / Founder</div>
                        {currentLead.directEmail !== 'N/A' && <div className="text-[12px] text-[#22c55e] mt-1 flex items-center gap-1">✉️ {currentLead.directEmail}</div>}
                      </div>
                    </div>
                    {currentLead.decisionMaker !== 'N/A' ? (
                      <span className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Verified</span>
                    ) : (
                      <span className="bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Needs Enrichment</span>
                    )}
                  </div>
                  <div className="bg-[#111118] border border-white/5 rounded-lg p-3 text-[12px] text-[#8888a0] leading-relaxed">
                    <strong>Note:</strong> We extracted the name <strong className="text-white">{currentLead.decisionMaker}</strong> automatically by scanning public emails found via Apify web crawling. This saves you from paying external API providers!
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ANALYSIS */}
              {activeTab === 'analysis' && (
                <div>
                  <div className="grid grid-cols-2 gap-3.5 mb-5">
                    <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                      <h4 className="text-[12px] uppercase tracking-wide text-[#8888a0] mb-3">Website Assessment</h4>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5"><span className="text-[13px] text-[#8888a0]">Website Exists</span><span className={`text-[13px] font-medium ${currentLead.website !== 'N/A' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{currentLead.website !== 'N/A' ? '⚠️ Weak' : '❌ No'}</span></div>
                      <div className="flex justify-between items-center py-1.5"><span className="text-[13px] text-[#8888a0]">Mobile Friendly</span><span className="text-[13px] font-medium text-[#ef4444]">❌ N/A</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                      <h4 className="text-[12px] uppercase tracking-wide text-[#8888a0] mb-3">Online Reputation</h4>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5"><span className="text-[13px] text-[#8888a0]">Google Rating</span><span className={`text-[13px] font-medium ${currentLead.rating >= 4.0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>⭐ {currentLead.rating}</span></div>
                      <div className="flex justify-between items-center py-1.5"><span className="text-[13px] text-[#8888a0]">Total Reviews</span><span className="text-[13px] font-medium text-[#f59e0b]">{currentLead.reviews}</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                      <h4 className="text-[12px] uppercase tracking-wide text-[#8888a0] mb-3">Social Media</h4>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5"><span className="text-[13px] text-[#8888a0]">Facebook</span><span className={`text-[13px] font-medium ${currentLead.social?.fb ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{currentLead.social?.fb ? '✅ Active' : '❌ Missing'}</span></div>
                      <div className="flex justify-between items-center py-1.5"><span className="text-[13px] text-[#8888a0]">Instagram</span><span className={`text-[13px] font-medium ${currentLead.social?.insta ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{currentLead.social?.insta ? '✅ Active' : '❌ Missing'}</span></div>
                    </div>
                    <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                      <h4 className="text-[12px] uppercase tracking-wide text-[#8888a0] mb-3">SEO Health</h4>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5"><span className="text-[13px] text-[#8888a0]">Local SEO</span><span className="text-[13px] font-medium text-[#ef4444]">❌ Poor</span></div>
                      <div className="flex justify-between items-center py-1.5"><span className="text-[13px] text-[#8888a0]">Keywords Ranking</span><span className="text-[13px] font-medium text-[#ef4444]">❌ None</span></div>
                    </div>
                  </div>
                  <div className="bg-[#4f6ef7]/10 border border-[#4f6ef7]/20 rounded-xl p-3.5 text-[13px] text-[#8888a0] leading-relaxed">
                    <strong className="text-[#4f6ef7]">🤖 AI Summary:</strong> {currentLead.companyName} has significant digital marketing gaps. {currentLead.website === 'N/A' && <span className="text-white font-medium">They have no website — the #1 priority. </span>} {currentLead.rating < 4.0 && <span className="text-white font-medium">Their low rating ({currentLead.rating}★) is hurting trust. </span>} This business is a <strong className={currentLead.score >= 70 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>{currentLead.score >= 70 ? 'HOT' : 'WARM'} lead</strong> for {service} services.
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PITCH */}
              {activeTab === 'pitch' && (
                <div>
                  <div className="bg-[#4f6ef7]/10 border border-[#4f6ef7]/20 rounded-lg p-3 text-[13px] mb-3 flex gap-2">
                    <strong className="text-[#4f6ef7] min-w-[55px]">Subject:</strong> <span>{pitchSubject || 'Generating...'}</span>
                  </div>
                  <div className={`bg-[#16161f] border border-white/5 rounded-xl p-4 text-[14px] leading-[1.75] whitespace-pre-wrap ${pitchLoading ? 'text-[#8888a0] italic' : 'text-white'}`}>
                    {pitchLoading ? `⚡ AI is writing your custom pitch for ${currentLead.companyName}...` : pitchContent}
                  </div>
                  {!pitchLoading && (
                    <div className="flex justify-end mt-3">
                      <button onClick={copyPitch} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${pitchCopied ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30' : 'bg-[#16161f] text-[#8888a0] border-white/5 hover:text-white'}`}>
                        {pitchCopied ? '✅ Copied!' : 'Copy Pitch'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: OPPORTUNITIES */}
              {activeTab === 'opportunities' && (
                <div>
                  <div className="mb-4 text-[13px] text-[#8888a0]">Found <strong className="text-white">{currentLead.opps.length} high-value opportunities</strong> for {service} sales with {currentLead.companyName}</div>
                  <div className="flex flex-col gap-2">
                    {currentLead.opps.includes('web') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-xl p-3.5 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-[#4f6ef7]/10 flex items-center justify-center text-[15px] shrink-0">🌐</div>
                        <div>
                          <div className="text-[13px] font-medium mb-1">Build Professional Website <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] font-semibold ml-1.5">🔥 HIGH IMPACT</span></div>
                          <div className="text-[12px] text-[#8888a0] leading-relaxed">{currentLead.companyName} has NO website. Every customer who Googles them hits a dead end. A site could convert 20-40% of visitors into leads.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('seo') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-xl p-3.5 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-[#4f6ef7]/10 flex items-center justify-center text-[15px] shrink-0">⭐</div>
                        <div>
                          <div className="text-[13px] font-medium mb-1">Reputation Management <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] font-semibold ml-1.5">🔥 HIGH IMPACT</span></div>
                          <div className="text-[12px] text-[#8888a0] leading-relaxed">{currentLead.rating}★ rating is below the 4.0 trust threshold. Active review management can lift rating within 60-90 days.</div>
                        </div>
                      </div>
                    )}
                    {currentLead.opps.includes('social') && (
                      <div className="bg-[#16161f] border border-white/5 rounded-xl p-3.5 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-[#4f6ef7]/10 flex items-center justify-center text-[15px] shrink-0">📸</div>
                        <div>
                          <div className="text-[13px] font-medium mb-1">Social Media Presence <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] font-semibold ml-1.5">⚡ MED IMPACT</span></div>
                          <div className="text-[12px] text-[#8888a0] leading-relaxed">Missing presence on fast-growing local discovery platforms. Before/after photos get massive organic reach.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 flex gap-2.5 justify-end bg-[#111118]">
              <button onClick={() => setModalOpen(false)} className="px-3.5 py-1.5 rounded-lg text-[13px] bg-[#16161f] border border-white/5 text-[#8888a0] hover:text-white transition-colors">Close</button>
              <button onClick={() => { setActiveTab('pitch'); generatePitch(); }} className="px-3.5 py-1.5 rounded-lg text-[13px] bg-[#4f6ef7]/10 border border-[#4f6ef7]/25 text-[#4f6ef7] font-medium">Re-generate Pitch</button>
              <button onClick={() => alert('📤 Outreach feature coming soon!')} className="px-3.5 py-1.5 rounded-lg text-[13px] bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] text-white font-medium hover:opacity-90">📤 Send Outreach</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
