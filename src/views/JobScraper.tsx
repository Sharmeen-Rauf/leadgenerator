import React, { useState } from 'react';
import { SearchForm } from '../components/scraper/SearchForm';
import { ProgressBar } from '../components/scraper/ProgressBar';
import { useToast } from '../components/ui/Toast';
import { Lead } from '../hooks/useLeads';
import { Briefcase, Zap, Target, ExternalLink } from 'lucide-react';

interface JobScraperProps {
  onAddLeads: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]) => Promise<any>;
  setActivePage: (page: string) => void;
}

export const JobScraper: React.FC<JobScraperProps> = ({
  onAddLeads,
  setActivePage
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('System Idle');
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);
  const [committing, setCommitting] = useState(false);
  const { showToast } = useToast();

  const handleRunScan = async (keyword: string, location: string, limit: number) => {
    setLoading(true);
    setProgress(0);
    setScrapedJobs([]);
    setStatusText('INITIALIZING JOB SCAN ENGINE...');

    // Progress simulation while API runs
    const statusSteps = [
      { prg: 10, text: 'LAUNCHING LINKEDIN JOBS ACTOR...' },
      { prg: 30, text: 'PARSING JOB BOARDS...' },
      { prg: 50, text: 'EXTRACTING HIRING COMPANIES...' },
      { prg: 70, text: 'ANALYZING BUYING INTENT...' },
      { prg: 90, text: 'BUFFERING RESPONSE SEGMENTS...' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < statusSteps.length) {
        setProgress(statusSteps[stepIdx].prg);
        setStatusText(statusSteps[stepIdx].text);
        stepIdx++;
      }
    }, 2000);

    try {
      const res = await fetch('/api/scrape/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, limit })
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        throw new Error(data.error || 'Scraper failed');
      }

      setProgress(100);
      setStatusText('SCAN BUFFER READY.');
      
      setScrapedJobs(data.jobs || []);
      showToast(`Scan complete. Found ${data.jobs?.length || 0} companies hiring.`, 'success');
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      showToast(err.message || 'Scrape failed. Check Apify credentials.', 'error');
      setProgress(0);
      setStatusText('SYSTEM ERROR.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitJobsAsLeads = async () => {
    if (scrapedJobs.length === 0) return;
    setCommitting(true);

    try {
      // Map job listings to Lead objects
      const leadsToCommit = scrapedJobs.map(job => ({
        company_name: job.companyName || 'Unknown Hiring Company',
        niche: job.title || 'Hiring Company',
        location: job.location || 'N/A',
        rating: 0,
        review_count: 0,
        phone: 'N/A',
        email: 'N/A',
        website: 'N/A',
        ai_score: 85, // Hiring intent is a strong buying signal
        opportunity_temp: 'hot' as const,
        gaps: ['HIRING'],
        est_revenue_loss: 5000,
        deal_value_min: 3000,
        deal_value_max: 10000,
        platform: 'N/A',
        site_speed: 'N/A',
        ssl_status: 'N/A',
        seo_score: 0,
        vulnerabilities: [`Actively hiring for: ${job.title}`],
        crm_status: 'new' as const,
        notes: `Intent Signal: Actively hiring for ${job.title}.\nJob Link: ${job.url || 'N/A'}\nCompany Link: ${job.companyUrl || 'N/A'}`,
        source_query: `Job Scrape: ${job.title}`,
        service_pitched: 'Outbound SDR / Talent Acquisition'
      }));

      const res = await onAddLeads(leadsToCommit);
      if (res) {
        setScrapedJobs([]);
        setActivePage('leads');
        showToast(`Saved ${leadsToCommit.length} job-intent lead(s) to CRM successfully.`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Saving to CRM failed: ' + err.message, 'error');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,184,0,0.15)]">
          <Briefcase className="w-5 h-5 text-[#FFB800]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white uppercase tracking-wider font-['Syne']">Job Intent Scraper</h2>
          <p className="text-xs text-neutral-400 font-mono">Find companies actively hiring (High Buying Intent)</p>
        </div>
      </div>

      <SearchForm onSearch={handleRunScan} loading={loading} />

      {!loading && progress === 0 && scrapedJobs.length === 0 && (
        <div className="tactical-glass p-5 border-[#FFB800]/25 bg-[#FFB800]/5 rounded-lg space-y-4 font-mono select-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 border-b border-[#FFB800]/10 pb-2.5">
            <Zap className="w-4 h-4 text-[#FFB800] fill-[#FFB800]/10 animate-pulse" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
              Job Scraping Guide
            </h4>
          </div>
          <p className="text-[9.5px] text-[#e2e8f0]/80 uppercase leading-relaxed font-semibold">
            Use this tool to find companies that are actively hiring for specific roles. Companies spending money on hiring are prime targets for B2B services.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px]">
            <div className="bg-black/45 border border-neutral-850 rounded p-3 space-y-1">
              <div className="text-neutral-500 font-extrabold font-mono text-[8px]">01 // KEYWORD</div>
              <h5 className="font-extrabold text-white uppercase">Search by Role</h5>
              <p className="text-neutral-450 uppercase leading-relaxed">
                Enter a job title like <span className="text-[#FFB800]">"React Developer"</span> or <span className="text-[#FFB800]">"Marketing Manager"</span>.
              </p>
            </div>
            <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 rounded p-3 space-y-1">
              <div className="text-[#FFB800]/70 font-extrabold font-mono text-[8px]">02 // CONVERT</div>
              <h5 className="font-extrabold text-[#FFB800] uppercase">Convert to Leads</h5>
              <p className="text-[#FFB800]/80 uppercase leading-relaxed">
                Scraped companies can be instantly added to your CRM pipeline as <span className="text-white font-extrabold">HOT LEADS</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {(loading || progress > 0) && scrapedJobs.length === 0 && (
        <ProgressBar progress={progress} statusText={statusText} />
      )}

      {scrapedJobs.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FFB800]" /> Scraped Job Listings ({scrapedJobs.length})
            </h3>
            <button
              onClick={handleCommitJobsAsLeads}
              disabled={committing}
              className="px-4 py-2 bg-[#FFB800] text-black font-extrabold text-[10px] uppercase tracking-wider rounded border-b-2 border-amber-600 hover:bg-[#FFB800]/90 transition-all disabled:opacity-50"
            >
              {committing ? 'Saving to CRM...' : 'Save Companies to CRM'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scrapedJobs.map((job, idx) => (
              <div key={idx} className="diag-stat-card bg-[#0A0E1A]/80 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[12px] font-bold text-white truncate pr-2" title={job.companyName}>{job.companyName || 'Unknown Company'}</h4>
                    <span className="text-[8px] px-1.5 py-0.5 bg-[#FFB800]/20 text-[#FFB800] rounded font-bold uppercase whitespace-nowrap">HIRING</span>
                  </div>
                  <div className="text-[10px] text-[#00D4FF] mb-1 font-semibold truncate">{job.title}</div>
                  <div className="text-[9px] text-neutral-500 mb-3">{job.location}</div>
                </div>
                <div className="border-t border-neutral-800 pt-3 mt-auto">
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] text-neutral-400 hover:text-white transition-colors">
                      View Job Posting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
