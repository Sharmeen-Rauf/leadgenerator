import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'green' | 'amber' | 'pink' | 'outline' | 'ghost' | 'secondary' | 'radar';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded transition-all duration-300 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizes = {
    sm: 'px-3 py-1.5 text-[10px] gap-1.5',
    md: 'px-4.5 py-2 text-xs gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5 h-[46px]'
  };

  const variants = {
    cyan: 'bg-[#00D4FF] text-[#080C18] hover:bg-[#00D4FF]/90 hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:scale-[1.02]',
    green: 'bg-[#39FF14] text-[#080C18] hover:bg-[#39FF14]/90 hover:shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:scale-[1.02]',
    amber: 'bg-[#FFB800] text-[#080C18] hover:bg-[#FFB800]/90 hover:shadow-[0_0_15px_rgba(255,184,0,0.4)] hover:scale-[1.02]',
    pink: 'bg-[#FF3366] text-[#080C18] hover:bg-[#FF3366]/90 hover:shadow-[0_0_15px_rgba(255,51,102,0.4)] hover:scale-[1.02]',
    outline: 'border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]',
    secondary: 'bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 hover:border-neutral-700',
    ghost: 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent',
    radar: 'radar-sweep-btn bg-gradient-to-r from-[#00D4FF] to-[#39FF14] text-[#080C18] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] shadow-lg'
  };

  return (
    <button
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  );
};
