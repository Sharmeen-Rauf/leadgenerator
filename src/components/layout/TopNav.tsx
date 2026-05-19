import React from 'react';
import { ChevronRight, Globe } from 'lucide-react';

interface TopNavProps {
  activePage: string;
}

export const TopNav: React.FC<TopNavProps> = ({ activePage }) => {
  const getPageTitle = (pageId: string) => {
    if (pageId.startsWith('stage-')) {
      return `PIPELINE_STAGE: ${pageId.replace('stage-', '').toUpperCase()}`;
    }
    return pageId.toUpperCase();
  };

  return (
    <header className="px-8 py-4 border-b border-[#00D4FF]/15 flex items-center justify-between bg-[#0A0E1A]/85 backdrop-blur-xl sticky top-0 z-50 select-none">
      <div className="flex items-center gap-3 font-mono text-[10px] font-bold text-neutral-500 tracking-wider">
        <span>CONSOLE</span>
        <ChevronRight className="w-3 h-3 text-[#00D4FF]" />
        <span>PITCHRADAR_OUTPOST</span>
        <ChevronRight className="w-3 h-3 text-[#00D4FF]" />
        <span className="text-[#00D4FF] font-extrabold hud-glow-cyan">
          {getPageTitle(activePage)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="inline-flex items-center gap-2 text-[10px] text-[#39FF14] bg-[#0A0E1A] px-3 py-1.5 rounded-md border border-[#39FF14]/30 font-mono font-bold">
          <span className="pulse-green-dot" /> 
          <span>LIVE API CONNECTION</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-bold text-white leading-none">COMMANDER RATIO</div>
            <div className="text-[8px] text-[#00D4FF] font-mono font-bold mt-0.5 tracking-widest">[ OUTPOST 01 ]</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0A0E1A] border border-[#00D4FF]/30 flex items-center justify-center text-xs font-mono font-extrabold text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.2)] hover:bg-[#00D4FF]/10 transition-all cursor-pointer">
            PR
          </div>
        </div>
      </div>
    </header>
  );
};
