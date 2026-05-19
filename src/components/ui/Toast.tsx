import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const ToastCard: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />,
    error: <XCircle className="w-4 h-4 text-[#FF3366]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#FFB800]" />,
    info: <Info className="w-4 h-4 text-[#00D4FF]" />,
  };

  const borders = {
    success: 'border-[#39FF14]/30 bg-[#080C18]/90 text-white shadow-[0_0_15px_rgba(57,255,20,0.15)]',
    error: 'border-[#FF3366]/30 bg-[#080C18]/90 text-white shadow-[0_0_15px_rgba(255,51,102,0.15)]',
    warning: 'border-[#FFB800]/30 bg-[#080C18]/90 text-white shadow-[0_0_15px_rgba(255,184,0,0.15)]',
    info: 'border-[#00D4FF]/30 bg-[#080C18]/90 text-white shadow-[0_0_15px_rgba(0,212,255,0.15)]',
  };

  return (
    <div 
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 border rounded-md backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${borders[toast.type]}`}
      onClick={onClose}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <span className="text-xs font-mono font-bold tracking-wider">{toast.message}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-neutral-500 hover:text-white transition-colors cursor-pointer text-[10px] font-mono">
        [DISMISS]
      </button>
    </div>
  );
};
