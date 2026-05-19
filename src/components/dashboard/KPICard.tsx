import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  variant?: 'cyan' | 'green' | 'amber' | 'pink';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  variant = 'cyan'
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 600; // ms
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const glows = {
    cyan: 'shadow-[0_8px_32px_rgba(0,212,255,0.08)] border-[#00D4FF]/15 hover:border-[#00D4FF]/30',
    green: 'shadow-[0_8px_32px_rgba(57,255,20,0.08)] border-[#39FF14]/15 hover:border-[#39FF14]/30',
    amber: 'shadow-[0_8px_32px_rgba(255,184,0,0.08)] border-[#FFB800]/15 hover:border-[#FFB800]/30',
    pink: 'shadow-[0_8px_32px_rgba(255,51,102,0.08)] border-[#FF3366]/15 hover:border-[#FF3366]/30',
  };

  const textColors = {
    cyan: 'text-[#00D4FF] hud-glow-cyan',
    green: 'text-[#39FF14] hud-glow-green',
    amber: 'text-[#FFB800]',
    pink: 'text-[#FF3366]',
  };

  return (
    <div className={`tactical-glass p-5 flex flex-col justify-between relative select-none ${glows[variant]}`}>
      <div>
        <div className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider mb-2">
          {title}
        </div>
        <div className={`text-[32px] font-bold tracking-tight leading-none font-mono ${textColors[variant]}`}>
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-4 border-t border-[#00D4FF]/10 pt-2 text-[10px] font-mono font-bold">
          {trend >= 0 ? (
            <span className="text-[#39FF14] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{trend.toFixed(1)}% vs last week
            </span>
          ) : (
            <span className="text-[#FF3366] flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> {trend.toFixed(1)}% vs last week
            </span>
          )}
        </div>
      )}
    </div>
  );
};
