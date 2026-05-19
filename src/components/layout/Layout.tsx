import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Lead } from '../../hooks/useLeads';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  leads: Lead[];
  credits: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activePage,
  setActivePage,
  leads,
  credits
}) => {
  return (
    <div className="flex min-h-screen font-sans antialiased bg-[#080C18] selection:bg-[#00D4FF]/30 text-[#F0F2F5]">
      {/* Drifting aurora background */}
      <div className="aurora-bg" />

      {/* Sidebar Panel */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        leads={leads} 
        credits={credits} 
      />

      {/* Main Workspace Frame */}
      <div className="ml-[240px] flex-1 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <TopNav activePage={activePage} />
        
        {/* Content Display viewport */}
        <main className="flex-1 p-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-150 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
