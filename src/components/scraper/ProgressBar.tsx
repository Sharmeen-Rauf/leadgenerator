import React from 'react';

interface ProgressBarProps {
  progress: number;
  statusText: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusText }) => {
  return (
    <div className="tactical-glass p-5 border-[#00D4FF]/15 space-y-3 font-mono select-none">
      <div className="flex justify-between items-center text-[10px]">
        <div className="flex items-center gap-2">
          <span className="pulse-green-dot animate-pulse" />
          <span className="text-[#39FF14] font-extrabold uppercase">{statusText}</span>
        </div>
        <span className="text-[#00D4FF] font-extrabold">{progress}%</span>
      </div>

      <div className="h-4 bg-black/60 border border-[#00D4FF]/20 rounded relative overflow-hidden">
        {/* Animated grid lines behind fill */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:10px_100%] pointer-events-none" />
        
        {/* Neon scan sweep bar */}
        <div 
          className="h-full bg-gradient-to-r from-[#00D4FF] via-[#39FF14] to-[#00D4FF] transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Neon laser head flare */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#39FF14]" />
        </div>
      </div>

      <div className="flex justify-between text-[8px] text-neutral-500">
        <span>EST. TIME REMAINING: {Math.max(0, Math.round((100 - progress) * 0.3))}s</span>
        <span>SCANNER_SPEED: 480Kb/s</span>
      </div>
    </div>
  );
};
