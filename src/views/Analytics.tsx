import React, { useState } from 'react';
import { 
  Database, RefreshCw, AlertTriangle, ShieldCheck, 
  Copy, Check, FileText, Globe, Key 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

interface AnalyticsProps {
  onRefreshAll: () => Promise<void>;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onRefreshAll }) => {
  const [seeding, setSeeding] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const SQL_SCHEMA = `-- PitchRadar Supabase SQL DDL Schema Setup
-- Copy and paste this directly into your Supabase SQL Editor:

-- 1. Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    niche TEXT,
    location TEXT,
    rating NUMERIC,
    review_count INTEGER,
    phone TEXT,
    email TEXT,
    website TEXT,
    ai_score INTEGER,
    opportunity_temp TEXT CHECK (opportunity_temp IN ('cold', 'warm', 'hot')),
    gaps TEXT[] DEFAULT '{}',
    est_revenue_loss NUMERIC,
    deal_value_min NUMERIC,
    deal_value_max NUMERIC,
    platform TEXT,
    site_speed TEXT,
    ssl_status TEXT,
    seo_score INTEGER,
    vulnerabilities TEXT[] DEFAULT '{}',
    crm_status TEXT CHECK (crm_status IN ('new', 'checked', 'contacted', 'proposal', 'closed_won', 'closed_lost')) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_contacted TIMESTAMP WITH TIME ZONE,
    source_query TEXT,
    service_pitched TEXT
);

-- 2. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    niche TEXT,
    location TEXT,
    service TEXT,
    total_leads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active'
);

-- 3. Create outreach_log table
CREATE TABLE IF NOT EXISTS outreach_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    channel TEXT CHECK (channel IN ('email', 'phone', 'social')) NOT NULL,
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    response TEXT,
    outcome TEXT CHECK (outcome IN ('no_reply', 'interested', 'rejected', 'booked')) DEFAULT 'no_reply'
);

-- 4. Create analytics_snapshots table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL DEFAULT current_date,
    total_leads INTEGER DEFAULT 0,
    new_leads INTEGER DEFAULT 0,
    checked INTEGER DEFAULT 0,
    contacted INTEGER DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    closed_won INTEGER DEFAULT 0,
    revenue_pipeline NUMERIC DEFAULT 0
);

-- 5. Enable Supabase Realtime subscriptions
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table campaigns;
alter publication supabase_realtime add table outreach_log;
alter publication supabase_realtime add table analytics_snapshots;

-- 6. Disable Row Level Security (RLS) to allow anonymous client-side dashboard queries
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots DISABLE ROW LEVEL SECURITY;
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    showToast("SQL script copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      showToast("Initializing database seed...", "info");

      // 1. Seed Demo Leads
      const demoLeads = [
        {
          company_name: "Aero Dental Care",
          niche: "Dentists",
          location: "Boston",
          rating: 4.2,
          review_count: 18,
          phone: "(617) 555-0143",
          email: "office@aerodentalboston.com",
          website: "https://aerodentalboston.com",
          ai_score: 84,
          opportunity_temp: "hot",
          gaps: ["SEO", "SOCIAL", "ADS"],
          est_revenue_loss: 4500,
          deal_value_min: 13500,
          deal_value_max: 27000,
          platform: "GoDaddy Builder",
          site_speed: "Slow (4.8s)",
          ssl_status: "Valid",
          seo_score: 32,
          vulnerabilities: ["No Google Ads Retargeting Pixel", "Weak Meta tags", "Poor page load speeds", "No SSL warning bypass needed"],
          crm_status: "new",
          notes: "Spoke to receptionist. Office manager handles vendor inquiries on Tuesdays. Website uses obsolete GoDaddy builder platform."
        },
        {
          company_name: "Apex Roofing Specialists",
          niche: "Roofers",
          location: "Austin",
          rating: 3.8,
          review_count: 8,
          phone: "(512) 555-0199",
          email: "sales@apexroofingaustin.com",
          website: "http://apexroofingaustin.com",
          ai_score: 92,
          opportunity_temp: "hot",
          gaps: ["SEO", "EMAIL", "WEB"],
          est_revenue_loss: 8000,
          deal_value_min: 24000,
          deal_value_max: 48000,
          platform: "Wix",
          site_speed: "Slow (5.2s)",
          ssl_status: "Invalid",
          seo_score: 24,
          vulnerabilities: ["Missing SSL Certificate", "Slow Mobile Performance", "No email capture forms", "Obsolete Wix platform"],
          crm_status: "checked",
          notes: "High average ticket roofing contractor. Website is down/unsecure. Great opportunity for a premium WordPress upgrade."
        },
        {
          company_name: "Boston Chiropractic Hub",
          niche: "Chiropractors",
          location: "Boston",
          rating: 4.8,
          review_count: 140,
          phone: "(617) 555-0211",
          email: "info@bostonchirohub.com",
          website: "https://bostonchirohub.com",
          ai_score: 45,
          opportunity_temp: "cold",
          gaps: ["SOCIAL"],
          est_revenue_loss: 1500,
          deal_value_min: 4500,
          deal_value_max: 9000,
          platform: "Custom React",
          site_speed: "Fast (1.2s)",
          ssl_status: "Valid",
          seo_score: 91,
          vulnerabilities: ["Missing Instagram social icons link"],
          crm_status: "contacted",
          notes: "Already has a modern marketing setup. Low priority lead."
        },
        {
          company_name: "Texas Trial Lawyers Group",
          niche: "Lawyers",
          location: "Dallas",
          rating: 4.1,
          review_count: 42,
          phone: "(214) 555-0322",
          email: "partner@texastriallawyers.com",
          website: "https://texastriallawyers.com",
          ai_score: 75,
          opportunity_temp: "warm",
          gaps: ["SEO", "ADS"],
          est_revenue_loss: 12000,
          deal_value_min: 36000,
          deal_value_max: 72000,
          platform: "WordPress",
          site_speed: "Slow (4.1s)",
          ssl_status: "Valid",
          seo_score: 48,
          vulnerabilities: ["No active Google Ads campaign", "Poor structured Schema markers"],
          crm_status: "proposal",
          notes: "Sent comprehensive SEO and PPC proposal. Follow-up meeting scheduled for Friday morning."
        }
      ];

      // Remove existing leads for clean demo seed
      const { error: clearError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (clearError) throw clearError;

      const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(demoLeads)
        .select();

      if (insertError) throw insertError;

      // 2. Seed Campaigns
      const demoCampaigns = [
        {
          name: "Dentist SEO Outpost",
          niche: "Dentists",
          location: "Boston",
          service: "SEO Audit & Optimization",
          total_leads: 1,
          status: "active"
        },
        {
          name: "Roofer Website Upgrades",
          niche: "Roofers",
          location: "Austin",
          service: "Web Design Redesign Package",
          total_leads: 1,
          status: "active"
        }
      ];
      await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('campaigns').insert(demoCampaigns);

      // 3. Seed Outreach Logs
      if (insertedLeads && insertedLeads.length > 0) {
        const bostonLead = insertedLeads.find(l => l.company_name.includes("Aero"));
        const texasLead = insertedLeads.find(l => l.company_name.includes("Trial"));
        const chiroLead = insertedLeads.find(l => l.company_name.includes("Boston Chiro"));

        const demoLogs = [];
        if (bostonLead) {
          demoLogs.push({
            lead_id: bostonLead.id,
            channel: "email",
            message: "Sent technical website speed audit demonstrating a 4.8 second mobile lag and missing ad pixels.",
            outcome: "no_reply",
            sent_at: new Date(Date.now() - 36 * 3600000).toISOString()
          });
        }
        if (texasLead) {
          demoLogs.push({
            lead_id: texasLead.id,
            channel: "email",
            message: "Submitted custom SEO audit and ad proposal for landing page optimization.",
            outcome: "interested",
            sent_at: new Date(Date.now() - 24 * 3600000).toISOString()
          });
          demoLogs.push({
            lead_id: texasLead.id,
            channel: "phone",
            message: "Call with junior partner. Scheduled full proposal review deck for Friday.",
            outcome: "booked",
            sent_at: new Date(Date.now() - 2 * 3600000).toISOString()
          });
        }
        if (chiroLead) {
          demoLogs.push({
            lead_id: chiroLead.id,
            channel: "social",
            message: "DM'd on Instagram mentioning broken link on their profile page.",
            outcome: "no_reply",
            sent_at: new Date(Date.now() - 48 * 3600000).toISOString()
          });
        }

        await supabase.from('outreach_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('outreach_log').insert(demoLogs);
      }

      // 4. Seed 30 days of Analytics Snapshots
      const demoSnapshots = Array.from({ length: 30 }).map((_, idx) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - idx));
        return {
          date: date.toISOString().split('T')[0],
          total_leads: 10 + Math.round(idx * 1.5),
          new_leads: Math.round(Math.random() * 3),
          checked: 4 + Math.round(idx * 0.8),
          contacted: 2 + Math.round(idx * 0.5),
          proposals_sent: 1 + Math.round(idx * 0.2),
          closed_won: Math.round(idx * 0.1),
          revenue_pipeline: 25000 + idx * 4000
        };
      });
      await supabase.from('analytics_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('analytics_snapshots').insert(demoSnapshots);

      await onRefreshAll();
      showToast("Demo seeds successfully injected to Supabase", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Seed execution failed: " + err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="select-none font-mono">
        <h2 className="text-sm font-extrabold text-white font-['Syne'] uppercase tracking-wider">System Control & Database Diagnostics</h2>
        <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">Connect and seed Supabase schema configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Setup instructions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="tactical-glass p-5 border-[#00D4FF]/15 font-mono select-none">
            <h4 className="text-[10px] text-white font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#00D4FF]" /> Supabase Schema Setup Script
            </h4>
            <p className="text-[10px] text-neutral-405 leading-relaxed mb-4">
              To utilize real Supabase queries, copy this DDL setup script and run it in the SQL Editor of your Supabase project console. This initializes tables, checks, and enables real-time listeners.
            </p>

            <div className="relative bg-black/60 border border-[#00D4FF]/25 rounded p-4 h-[250px] overflow-y-auto custom-scrollbar select-text text-[9px] font-mono text-neutral-350 leading-relaxed">
              <pre className="whitespace-pre-wrap">{SQL_SCHEMA}</pre>
              <button 
                onClick={handleCopySQL}
                className="absolute right-4 top-4 bg-neutral-900 border border-[#00D4FF]/25 hover:border-[#00D4FF]/50 text-neutral-400 hover:text-white px-2 py-1 rounded text-[8px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY CODE'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Database Seed & Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="tactical-glass p-5 border-[#00D4FF]/15 font-mono select-none flex flex-col justify-between h-full">
            <div>
              <h4 className="text-[10px] text-[#39FF14] font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#39FF14]" /> Database Ingestion Control
              </h4>
              <p className="text-[10px] text-neutral-405 leading-relaxed mb-6">
                Clicking the seed button below will instantly purge existing records and insert 4 high-quality pre-audited leads, 2 sequences, 4 logs, and a 30-day snapshot series into your Supabase project so you can immediately explore the Tactical Command Center.
              </p>
            </div>

            <div className="bg-[#0A0D1A]/55 border border-[#39FF14]/20 rounded p-4 mb-6 flex gap-3.5 items-start">
              <AlertTriangle className="w-6 h-6 text-[#FFB800] shrink-0 animate-pulse" />
              <div className="text-[9px] text-neutral-400 leading-relaxed uppercase">
                <span className="text-[#FFB800] font-extrabold block mb-1">WARNING: DATA MUTATION HAZARD</span>
                Seeding demo data will truncate existing logs. Ensure you have backups before committing.
              </div>
            </div>

            <Button 
              variant="green" 
              className="w-full text-center h-12"
              onClick={handleSeedDemoData} 
              loading={seeding}
            >
              <RefreshCw className="w-4 h-4 shrink-0" /> Commit Demo Seeds to Supabase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
