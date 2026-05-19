import React from 'react';
import { 
  Search, Target, Send, BarChart2, Users, Mail, Globe, Star, 
  Phone, Flame, LayoutDashboard, Building2, MapPin, ChevronRight, 
  Check, Copy, Network, Activity, DollarSign, TrendingUp, Shield, 
  MessageSquare, Filter, CheckSquare, Square, Settings, Link2, Zap
} from 'lucide-react';
import { Lead } from '../../hooks/useLeads';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  leads: Lead[];
  credits: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  leads,
  credits
}) => {
  // Calculate pipeline counts
  const countByStage = (stage: Lead['crm_status']) => {
    return leads.filter((l) => l.crm_status === stage).length;
  };

  interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    variant?: string;
  }

  interface SidebarSection {
    section: string;
    items: SidebarItem[];
  }

  const menuItems: SidebarSection[] = [
    {
      section: 'CORE',
      items: [
        { id: 'scraper', label: 'Lead Scraper', icon: <Search className="w-4 h-4" /> },
        { id: 'leads', label: 'All Leads', icon: <Target className="w-4 h-4" /> }
      ]
    },
    {
      section: 'PIPELINE',
      items: [
        { id: 'stage-new', label: 'New Leads', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />, badge: countByStage('new'), variant: 'cyan' },
        { id: 'stage-checked', label: 'Checked', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />, badge: countByStage('checked'), variant: 'amber' },
        { id: 'stage-contacted', label: 'Contacted', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />, badge: countByStage('contacted'), variant: 'cyan' },
        { id: 'stage-proposal', label: 'Proposal Sent', icon: <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />, badge: countByStage('proposal'), variant: 'purple' },
        { id: 'stage-won', label: 'Closed Won', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />, badge: countByStage('closed_won'), variant: 'green' },
        { id: 'stage-lost', label: 'Closed Lost', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#FF3366]" />, badge: countByStage('closed_lost'), variant: 'pink' }
      ]
    },
    {
      section: 'OUTREACH',
      items: [
        { id: 'campaigns', label: 'Campaigns', icon: <Send className="w-4 h-4" /> },
        { id: 'outreach-log', label: 'Outreach Log', icon: <Mail className="w-4 h-4" /> }
      ]
    },
    {
      section: 'INTELLIGENCE',
      items: [
        { id: 'dashboard', label: 'Analytics Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'pipeline-value', label: 'Revenue Pipeline', icon: <TrendingUp className="w-4 h-4" /> }
      ]
    },
    {
      section: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        { id: 'integrations', label: 'Integrations', icon: <Link2 className="w-4 h-4" /> }
      ]
    }
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#070A14]/90 border-r border-[#00D4FF]/15 flex flex-col z-[100] backdrop-blur-xl">
      {/* Brand logo */}
      <div className="p-6 border-b border-[#00D4FF]/15 select-none">
        <div className="inline-flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-[#0A0E1A] rounded-lg flex items-center justify-center border border-[#00D4FF]/30 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <Zap className="w-4 h-4 text-[#00D4FF] fill-[#00D4FF]/20" />
          </div>
          <div>
            <div className="font-['Syne'] text-[17px] font-extrabold tracking-wider text-white uppercase hud-glow-cyan">PitchRadar</div>
            <div className="text-[8px] text-[#00D4FF]/70 tracking-widest uppercase mt-0.5 font-mono font-bold">TACTICAL HUD v3.0</div>
          </div>
        </div>
      </div>

      {/* Navigation items list */}
      <nav className="p-4 flex-1 overflow-y-auto font-mono custom-scrollbar">
        {menuItems.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            <div className="text-[9px] tracking-widest uppercase text-neutral-500 px-3 pt-2 pb-1.5 font-bold">
              {section.section}
            </div>
            {section.items.map((item) => {
              const isActive = activePage === item.id;
              
              let badgeColor = 'bg-[#00D4FF] text-black';
              if (item.variant === 'green') badgeColor = 'bg-[#39FF14] text-black';
              if (item.variant === 'pink') badgeColor = 'bg-[#FF3366] text-white';
              if (item.variant === 'amber') badgeColor = 'bg-[#FFB800] text-black';
              if (item.variant === 'purple') badgeColor = 'bg-purple-500 text-white';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left text-[11px] font-bold transition-all duration-300 mb-0.5 border ${
                    isActive 
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF]/40 text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.1)]' 
                      : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono leading-none ${badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Credit Console */}
      <div className="p-4 border-t border-[#00D4FF]/15 bg-[#070A14]/50 select-none">
        <div className="bg-[#0A0D1A]/90 border border-[#00D4FF]/20 rounded-lg p-4 relative overflow-hidden group cursor-pointer hover:border-[#00D4FF]/40 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF]/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <div className="flex items-center gap-2 mb-1.5 font-mono">
            <Zap className="w-3.5 h-3.5 text-[#39FF14] fill-[#39FF14]/20 animate-pulse" />
            <span className="text-[10px] text-white font-extrabold tracking-wider">SECURE POWER UNIT</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 flex justify-between items-center">
            <span>ACTIVE CODES:</span>
            <span className="text-[#00D4FF] font-extrabold">{credits} U</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-[#0A0E1A] border border-[#00D4FF]/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00D4FF] to-[#39FF14] transition-all duration-500" style={{ width: `${(credits/1000)*100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
