'use client';

import React, { useState, useCallback } from 'react';
import { 
  Users, Search, Globe, Mail, ShieldCheck, 
  ShieldX, Check, Copy, Plus, Loader2, ArrowUpRight 
} from 'lucide-react';

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

interface DecisionMakerFinderProps {
  onAddLeads: (leads: any[]) => Promise<any>;
  setActivePage: (page: string) => void;
}

interface EnrichedPerson {
  fullName: string;
  role: string;
  linkedinUrl: string;
  email: string;
  emailFormats: Record<string, string>;
  mxVerified: boolean;
  domain: string;
  companyName: string;
}

const ROLE_OPTIONS = [
  { id: 'CEO', label: 'CEO / Founders' },
  { id: 'Founder', label: 'Co-Founders' },
  { id: 'Owner', label: 'Owners' },
  { id: 'Marketing', label: 'Marketing Managers' },
  { id: 'Sales', label: 'Sales / BD' },
  { id: 'Engineering', label: 'Engineering' }
];

export const DecisionMakerFinder: React.FC<DecisionMakerFinderProps> = ({
  onAddLeads,
  setActivePage
}) => {
  const [domain, setDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['CEO', 'Founder', 'Owner']);
  const [limit, setLimit] = useState(10);
  const [searching, setSearching] = useState(false);
  const [people, setPeople] = useState<EnrichedPerson[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [importedIndex, setImportedIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleFindDecisionMakers = async () => {
    if (!domain.trim()) {
      showToast('Please enter a target domain first', 'error');
      return;
    }
    if (selectedRoles.length === 0) {
      showToast('Please select at least one role category', 'error');
      return;
    }

    setSearching(true);
    setPeople([]);
    setImportedIndex(null);

    try {
      const res = await fetch('/api/scrape/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.trim(),
          companyName: companyName.trim() || undefined,
          roles: selectedRoles,
          maxResults: limit
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search for decision makers');

      setPeople(data.people || []);
      if (data.people?.length === 0) {
        showToast('No matching decision makers found. Try broader keywords.', 'info');
      } else {
        showToast(`Successfully resolved ${data.people.length} decision makers!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Scrape execution failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleCopy = (email: string, idx: number) => {
    navigator.clipboard.writeText(email);
    setCopiedIndex(idx);
    showToast('Email address copied to clipboard', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleImportLead = async (person: EnrichedPerson, idx: number) => {
    setImportedIndex(idx);
    
    // Map decision maker record to the PitchRadar Lead database schema
    const newLead = {
      company_name: person.companyName,
      niche: person.role || 'B2B Decision Maker',
      location: 'N/A',
      rating: 0,
      review_count: 0,
      phone: 'N/A',
      email: person.email,
      website: person.domain,
      ai_score: 75,
      opportunity_temp: 'warm' as const,
      gaps: [],
      est_revenue_loss: 0,
      deal_value_min: 1500,
      deal_value_max: 3000,
      platform: 'N/A',
      site_speed: 'N/A',
      ssl_status: person.mxVerified ? 'Valid' : 'Invalid',
      seo_score: 0,
      vulnerabilities: [],
      crm_status: 'new' as const,
      notes: [
        `Decision Maker: ${person.fullName}`,
        `Title: ${person.role}`,
        `LinkedIn: ${person.linkedinUrl}`,
        `Predictive Match: Email formats checked via DNS MX records.`
      ].join('\n'),
      source_query: `People Recon Finder: ${person.domain}`,
      service_pitched: 'SEO & Web Upgrades'
    };

    try {
      const res = await onAddLeads([newLead]);
      if (res) {
        showToast(`Imported ${person.fullName} successfully!`, 'success');
        // Filter out imported contact from current buffer list
        setPeople(prev => prev.filter((_, i) => i !== idx));
      }
    } catch (err: any) {
      console.error(err);
      showToast('Ingestion failed: ' + err.message, 'error');
    } finally {
      setImportedIndex(null);
    }
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* ── Search Input Panel ── */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15">
        <div className="flex items-center gap-2 border-b border-[#00D4FF]/10 pb-3 mb-4">
          <Users className="w-4.5 h-4.5 text-[#00D4FF]" />
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Apollo B2B Decision Maker Finder</h3>
            <p className="text-[8px] text-neutral-500 mt-0.5 uppercase tracking-widest">Find company employees, LinkedIn profiles, and verified direct email formats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Domain Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Company Domain</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value.toLowerCase())}
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-4 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all lowercase"
                placeholder="e.g. stripe.com, soji.us"
                disabled={searching}
              />
            </div>
          </div>

          {/* Optional Company Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Company Name (Optional)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded pl-9 pr-4 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all uppercase"
                placeholder="e.g. Stripe, Soji Care"
                disabled={searching}
              />
            </div>
          </div>

          {/* Target Roles Checkbox List */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Target Job Roles</label>
            <div className="grid grid-cols-3 gap-2 bg-black/40 border border-[#00D4FF]/10 rounded p-2 text-[9px] font-bold text-neutral-350">
              {ROLE_OPTIONS.map(role => {
                const active = selectedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleToggle(role.id)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left"
                    disabled={searching}
                  >
                    <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 border border-neutral-700 rounded-sm">
                      {active && <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-sm" />}
                    </div>
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#00D4FF]/10">
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Max Results Limit:</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="bg-black border border-neutral-800 rounded px-2.5 py-1 text-[10px] text-neutral-400 focus:border-[#00D4FF] cursor-pointer outline-none font-bold"
              disabled={searching}
            >
              <option value="5">5 Profiles</option>
              <option value="10">10 Profiles</option>
              <option value="20">20 Profiles</option>
            </select>
          </div>

          <Button
            variant="cyan"
            size="sm"
            onClick={handleFindDecisionMakers}
            loading={searching}
            disabled={searching || !domain.trim()}
          >
            <Users className="w-3.5 h-3.5 mr-1" /> Reconstruct Decision Makers
          </Button>
        </div>
      </div>

      {/* ── Search Output List Table ── */}
      {people.length > 0 && (
        <div className="tactical-glass p-5 border-[#00D4FF]/15 animate-in fade-in slide-in-from-bottom-2 duration-150 ease-out">
          <div className="flex items-center justify-between border-b border-[#00D4FF]/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#39FF14]" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Decision Maker Resolution Buffer ({people.length} Nodes)</h3>
            </div>
            <Badge variant="green">RESOLVED</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-[#00D4FF]/10 text-neutral-500 font-extrabold uppercase">
                  <th className="py-2 pr-4">Decision Maker</th>
                  <th className="py-2 px-4">Title / Role</th>
                  <th className="py-2 px-4">LinkedIn Profile</th>
                  <th className="py-2 px-4">Predicted Email Address</th>
                  <th className="py-2 px-4 text-center">MX Check</th>
                  <th className="py-2 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00D4FF]/5 text-neutral-300 font-semibold">
                {people.map((person, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {/* Name */}
                    <td className="py-2.5 pr-4">
                      <div className="font-extrabold text-white uppercase">{person.fullName}</div>
                      <div className="text-[8px] text-neutral-500 uppercase">{person.companyName}</div>
                    </td>

                    {/* Role */}
                    <td className="py-2.5 px-4">
                      <span className="text-neutral-400 font-bold uppercase">{person.role}</span>
                    </td>

                    {/* LinkedIn Link */}
                    <td className="py-2.5 px-4">
                      {person.linkedinUrl ? (
                        <a
                          href={person.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Linkedin className="w-3 h-3 text-[#00D4FF]/80 fill-current" />
                          <span>View Profile</span>
                          <ArrowUpRight className="w-2.5 h-2.5 opacity-50" />
                        </a>
                      ) : (
                        <span className="text-neutral-600">N/A</span>
                      )}
                    </td>

                    {/* Email Predictor */}
                    <td className="py-2.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-white bg-black/45 px-2 py-1 border border-neutral-800 rounded font-semibold text-[10px]">
                          {person.email}
                        </span>
                        <button
                          onClick={() => handleCopy(person.email, idx)}
                          className="text-neutral-500 hover:text-[#00D4FF] transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* MX Verification badge */}
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        person.mxVerified
                          ? 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14] shadow-[0_0_6px_rgba(57,255,20,0.06)]'
                          : 'bg-[#FF3366]/10 border-[#FF3366]/30 text-[#FF3366] shadow-[0_0_6px_rgba(255,51,102,0.06)]'
                      }`}>
                        {person.mxVerified ? <ShieldCheck className="w-2.5 h-2.5" /> : <ShieldX className="w-2.5 h-2.5" />}
                        {person.mxVerified ? 'Deliverable' : 'Fail'}
                      </span>
                    </td>

                    {/* Ingest Actions */}
                    <td className="py-2.5 pl-4 text-right">
                      <Button
                        variant="green"
                        size="sm"
                        onClick={() => handleImportLead(person, idx)}
                        disabled={importedIndex === idx}
                      >
                        {importedIndex === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Plus className="w-3 h-3 mr-1" />
                        )}
                        Import Lead
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
