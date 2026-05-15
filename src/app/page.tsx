"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Download, Building2, MapPin, Target, Sparkles, ChevronRight, Globe, Phone, Map } from "lucide-react";

export default function Home() {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [prompt, setPrompt] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche && !prompt) {
      setError("Please enter a niche or search prompt.");
      return;
    }
    
    setError("");
    setIsLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, prompt }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results || !results.leads || results.leads.length === 0) return;
    
    const headers = ["Company Name", "Category", "Rating", "Reviews", "Phone", "Website", "Address"];
    const rows = results.leads.map((lead: any) => [
      `"${lead.companyName}"`,
      `"${lead.category}"`,
      `"${lead.rating}"`,
      `"${lead.reviews}"`,
      `"${lead.phone}"`,
      `"${lead.website}"`,
      `"${lead.address}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `antigravity_leads_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start pt-20 px-4 sm:px-6">
      
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 w-full max-w-4xl mx-auto mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300 font-medium">Antigravity AI Agent</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
          Intelligent Lead <br/> Generation
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Automate your business research. Enter your target niche and location, and let the AI extract, clean, and structure public data in seconds.
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        onSubmit={handleSearch}
        className="w-full max-w-3xl z-10 glass rounded-2xl p-2 md:p-3 flex flex-col md:flex-row gap-3 shadow-2xl glow mb-16"
      >
        <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-xl px-4 py-3 group focus-within:border-blue-500/50 transition-colors">
          <Target className="w-5 h-5 text-gray-500 group-focus-within:text-blue-400 mr-3" />
          <input 
            type="text" 
            placeholder="Niche (e.g. Software Houses)" 
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-white placeholder-gray-500"
          />
        </div>
        <div className="flex-1 flex items-center bg-black/40 border border-white/5 rounded-xl px-4 py-3 group focus-within:border-blue-500/50 transition-colors">
          <MapPin className="w-5 h-5 text-gray-500 group-focus-within:text-blue-400 mr-3" />
          <input 
            type="text" 
            placeholder="Location (e.g. Dubai)" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-white placeholder-gray-500"
          />
        </div>
        <button 
          disabled={isLoading}
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 py-3 md:py-0 font-medium transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Extract</>}
        </button>
      </motion.form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg mb-8"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-4 my-12"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-pulse" />
              <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-gray-400 animate-pulse">Agent is extracting data...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl z-10 flex flex-col gap-6 pb-20"
          >
            {/* Insights Panel */}
            <div className="glass border border-white/10 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-blue-400"/> AI Insights</h3>
                <p className="text-gray-400">{results.insights}</p>
              </div>
              <button 
                onClick={exportCSV}
                className="bg-white/10 hover:bg-white/20 border border-white/10 transition-colors px-4 py-2 rounded-lg flex items-center text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </button>
            </div>

            {/* Data Table */}
            <div className="glass border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.leads.map((lead: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                          {lead.companyName}
                        </td>
                        <td className="px-6 py-4">{lead.category}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-medium border border-yellow-500/20">
                            ★ {lead.rating} ({lead.reviews})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {lead.phone !== 'N/A' && <span className="flex items-center text-xs"><Phone className="w-3 h-3 mr-1 text-gray-500"/>{lead.phone}</span>}
                            {lead.website !== 'N/A' && <a href={lead.website} target="_blank" className="flex items-center text-xs text-blue-400 hover:underline"><Globe className="w-3 h-3 mr-1"/>Website</a>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-start text-xs"><Map className="w-3 h-3 mr-1 mt-0.5 text-gray-500 flex-shrink-0"/> <span className="truncate max-w-[200px] block" title={lead.address}>{lead.address}</span></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.leads.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No records found. Try adjusting your search criteria.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
