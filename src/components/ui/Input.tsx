import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  containerClassName = '',
  id,
  className = '',
  ...props
}) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  return (
    <div className={`relative flex-1 min-w-[200px] scanline-focus ${containerClassName}`}>
      <input
        id={inputId}
        className={`peer pt-5 pb-2 px-4 w-full bg-[#080C18]/90 border border-[#00D4FF]/20 rounded-md focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all placeholder-transparent text-sm text-white font-mono font-semibold ${className}`}
        placeholder={label}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="absolute left-4 top-1.5 text-[8px] text-neutral-500 uppercase tracking-widest transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-neutral-400 peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#00D4FF] pointer-events-none select-none"
      >
        {label}
      </label>
      {icon && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
};
