import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'green' | 'amber' | 'pink' | 'muted' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const styles = {
    cyan: 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_8px_rgba(0,212,255,0.15)]',
    green: 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 shadow-[0_0_8px_rgba(57,255,20,0.15)]',
    amber: 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30 shadow-[0_0_8px_rgba(255,184,0,0.15)]',
    pink: 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30 shadow-[0_0_8px_rgba(255,51,102,0.15)]',
    muted: 'bg-neutral-900/60 text-neutral-400 border border-neutral-800',
    default: 'bg-neutral-800 text-white border border-neutral-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
