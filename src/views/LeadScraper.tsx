import React, { useState } from 'react';
import { SearchForm } from '../components/scraper/SearchForm';
import { ProgressBar } from '../components/scraper/ProgressBar';
import { ResultsPanel } from '../components/scraper/ResultsPanel';
import { useToast } from '../components/ui/Toast';
import { Lead } from '../hooks/useLeads';

interface LeadScraperProps {
  onAddLeads: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]) => Promise<any>;
  setActivePage: (page: string) => void;
}

export const LeadScraper: React.FC<LeadScraperProps> = ({
  onAddLeads,
  setActivePage
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('System Idle');
  const [scrapedResults, setScrapedResults] = useState<any[]>([]);
  const [committing, setCommitting] = useState(false);
  const { showToast } = useToast();

  const handleRunScan = async (niche: string, location: string, limit: number) => {
    setLoading(true);
    setProgress(0);
    setScrapedResults([]);
    setStatusText('INITIALIZING SCAN ENGINE...');

    // Progress simulation while API runs
    const statusSteps = [
      { prg: 5, text: 'LAUNCHING GOOGLE PLACES ACTOR...' },
      { prg: 15, text: 'PARSING LOCAL MAP NODES...' },
      { prg: 30, text: 'HARVESTING BUSINESS IDENTITIES...' },
      { prg: 45, text: 'ESTABLISHING SERVER CRAWLER GATES...' },
      { prg: 60, text: 'AUDITING SEO DOM TAGS...' },
      { prg: 75, text: 'IDENTIFYING CONVERSION GAPS...' },
      { prg: 90, text: 'CALCULATING AI GAP PRIORITY MATRIX...' },
      { prg: 95, text: 'BUFFERING RESPONSE SEGMENTS...' }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < statusSteps.length) {
        setProgress(statusSteps[stepIdx].prg);
        setStatusText(statusSteps[stepIdx].text);
        stepIdx++;
      }
    }, 2500);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, limit })
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        throw new Error(data.error || 'Scraper failed');
      }

      setProgress(100);
      setStatusText('SCAN BUFFER READY.');
      
      const formatted = (data.leads || []).map((item: any) => ({
        company_name: item.companyName || 'Unknown Business',
        niche: item.category || 'N/A',
        location: item.city || 'N/A',
        rating: Number(item.rating) || 0,
        review_count: Number(item.reviews) || 0,
        phone: item.phone || 'N/A',
        email: item.email || 'N/A',
        website: item.website || 'N/A',
        ai_score: Number(item.score) || 0,
        opportunity_temp: (item.temperature?.toLowerCase() || 'cold') as Lead['opportunity_temp'],
        gaps: (item.opps || []).map((o: string) => o.toUpperCase()),
        est_revenue_loss: Number(item.scoring?.revenue?.estimatedMonthlyLoss) || 0,
        deal_value_min: Number(item.scoring?.revenue?.estimatedMonthlyLoss || 0) * 3,
        deal_value_max: Number(item.scoring?.revenue?.estimatedMonthlyLoss || 0) * 6,
        platform: item.siteAnalysis?.cms || 'N/A',
        site_speed: item.siteAnalysis?.loadTime > 4000 ? 'Slow' : 'Fast',
        ssl_status: item.siteAnalysis?.ssl ? 'Valid' : 'Invalid',
        seo_score: Number(item.siteAnalysis?.seoScore) || 0,
        vulnerabilities: item.siteAnalysis?.opportunities || [],
        crm_status: 'new' as const,
        notes: (item.siteAnalysis?.opportunities || []).join('\n'),
        source_query: item.source_query || '',
        service_pitched: item.scoring?.revenue?.topService || 'N/A'
      }));

      setScrapedResults(formatted);
      showToast(`Scan complete. ${data.leads?.length || 0} entities buffered.`, 'success');
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

  const handleCommit = async () => {
    if (scrapedResults.length === 0) return;
    setCommitting(true);

    try {
      const res = await onAddLeads(scrapedResults);
      if (res) {
        setScrapedResults([]);
        // Redirect to leads page
        setActivePage('leads');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Ingestion failed: ' + err.message, 'error');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Query Console */}
      <SearchForm onSearch={handleRunScan} loading={loading} />

      {/* Ingestion progress bar */}
      {(loading || progress > 0) && scrapedResults.length === 0 && (
        <ProgressBar progress={progress} statusText={statusText} />
      )}

      {/* Buffering results table */}
      {scrapedResults.length > 0 && (
        <ResultsPanel 
          results={scrapedResults} 
          onCommit={handleCommit} 
          committing={committing} 
        />
      )}
    </div>
  );
};
