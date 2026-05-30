"use client";

import { useState, useCallback } from "react";
import { ToastProvider } from "../components/ui/Toast";
import { Layout } from "../components/layout/Layout";
import { Dashboard } from "../views/Dashboard";
import { AllLeads } from "../views/AllLeads";
import { LeadScraper } from "../views/LeadScraper";
import { Campaigns } from "../views/Campaigns";
import { OutreachLog } from "../views/OutreachLog";
import { Sequences } from "../views/Sequences";
import { Analytics } from "../views/Analytics";
import { LeadModal } from "../components/leads/LeadModal";
import { LogModal } from "../components/outreach/LogModal";
import { useLeads, Lead } from "../hooks/useLeads";
import { useAnalytics } from "../hooks/useAnalytics";
import { useRealtime } from "../hooks/useRealtime";

export default function Home() {
  return (
    <ToastProvider>
      <CommandCenter />
    </ToastProvider>
  );
}

function CommandCenter() {
  // Navigation State
  const [activePage, setActivePage] = useState("dashboard");

  // Dynamic Credits
  const [credits, setCredits] = useState(2480);

  // Popup Modal States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadModalTab, setLeadModalTab] = useState<'diagnostic' | 'pitch'>('diagnostic');
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null);

  // Supabase CRUD & Live Subscriptions Hooks
  const { 
    leads, 
    loading: leadsLoading, 
    addLeads, 
    updateLeadStatus, 
    updateLeadNotes,
    fetchLeads,
    logOutreach,
    enrichLead
  } = useLeads();

  const { 
    outreachLogs, 
    snapshots, 
    loading: analyticsLoading, 
    fetchAnalyticsData 
  } = useAnalytics();

  // Establish Real-time Subscriptions (Updates lists instantly when table changes happen)
  useRealtime("leads", "*", fetchLeads);
  useRealtime("campaigns", "*", fetchAnalyticsData);
  useRealtime("outreach_log", "*", fetchAnalyticsData);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([fetchLeads(), fetchAnalyticsData()]);
  }, [fetchLeads, fetchAnalyticsData]);

  // Page switcher router render
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
      case "pipeline-value":
        return (
          <Dashboard
            leads={leads}
            outreachLogs={outreachLogs}
            snapshots={snapshots}
            onSelectLead={(l) => { setSelectedLead(l); setLeadModalTab('diagnostic'); }}
          />
        );
      case "leads":
      case "stage-new":
      case "stage-checked":
      case "stage-contacted":
      case "stage-proposal":
      case "stage-won":
      case "stage-lost":
        return (
          <AllLeads
            leads={leads}
            loading={leadsLoading}
            activePage={activePage}
            updateLeadStatus={updateLeadStatus}
            onSelectLead={(l) => { setSelectedLead(l); setLeadModalTab('diagnostic'); }}
            onOpenPitch={(l) => { setSelectedLead(l); setLeadModalTab('pitch'); }}
            onOpenOutreachLog={setOutreachLead}
          />
        );
      case "scraper":
        return (
          <LeadScraper 
            onAddLeads={async (newLeadsList) => {
              const res = await addLeads(newLeadsList);
              if (res) {
                setCredits(prev => Math.max(0, prev - newLeadsList.length));
              }
              return res;
            }} 
            setActivePage={setActivePage} 
          />
        );
      case "campaigns":
        return <Campaigns leads={leads} />;
      case "sequences":
        return <Sequences leads={leads} />;
      case "outreach-log": // Match the ID used in Sidebar.tsx menuItems
        return (
          <OutreachLog 
            outreachLogs={outreachLogs} 
            loading={analyticsLoading} 
          />
        );
      case "settings": // Settings DDL configuration
      case "integrations": // API keys and instructions
        return <Analytics onRefreshAll={handleRefreshAll} />;
      default:
        return (
          <div className="text-center py-12 text-neutral-500 font-mono text-xs uppercase">
            Navigation route unresolved ({activePage}). Use the sidebar menu to navigate.
          </div>
        );
    }
  };

  return (
    <>
      {/* Sidebar, TopNav, and Aurora drifting background */}
      <Layout 
        activePage={activePage} 
        setActivePage={setActivePage}
        leads={leads}
        credits={credits}
      >
        {renderContent()}
      </Layout>

      {/* POPUP MODALS SEGMENT */}
      
      {/* 1. Unified Lead Diagnostic + AI Pitch Modal */}
      <LeadModal
        lead={selectedLead ? leads.find(l => l.id === selectedLead.id) || selectedLead : null}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onSaveNotes={updateLeadNotes}
        outreachLogs={outreachLogs}
        onLogOutreach={logOutreach}
        updateLeadStatus={updateLeadStatus}
        onEnrich={enrichLead}
        initialTab={leadModalTab}
      />

      {/* 2. Outreach Action Logger Modal */}
      <LogModal
        lead={outreachLead}
        isOpen={!!outreachLead}
        onClose={() => setOutreachLead(null)}
        onLogOutreach={logOutreach}
      />
    </>
  );
}

