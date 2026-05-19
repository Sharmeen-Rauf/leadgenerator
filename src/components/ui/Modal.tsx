import React from 'react';
import { XCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-[950px]'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#080C18]/85 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl"
      onClick={onClose}
    >
      <div 
        className={`bg-[#080C18]/95 border-2 border-[#00D4FF]/25 rounded-md w-full ${maxWidth} h-[85vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,212,255,0.2)] animate-in scale-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#00D4FF]/15 flex items-center justify-between bg-[#080C18]/80 select-none shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-white font-['Syne'] uppercase tracking-wider">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-neutral-500 font-mono mt-1 tracking-wider uppercase">{subtitle}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-neutral-900 border border-[#00D4FF]/25 hover:border-[#00D4FF]/50 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <XCircle className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#00D4FF]/15 flex gap-3 justify-end bg-[#080C18]/80 font-mono select-none shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
