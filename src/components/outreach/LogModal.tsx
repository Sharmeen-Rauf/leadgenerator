import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Save } from 'lucide-react';
import { Lead } from '../../hooks/useLeads';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface LogModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLogOutreach: (
    leadId: string,
    channel: 'email' | 'phone' | 'social',
    message: string,
    outcome: 'no_reply' | 'interested' | 'rejected' | 'booked'
  ) => Promise<void>;
}

export const LogModal: React.FC<LogModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLogOutreach
}) => {
  const [channel, setChannel] = useState<'email' | 'phone' | 'social'>('email');
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<'no_reply' | 'interested' | 'rejected' | 'booked'>('no_reply');
  const [saving, setSaving] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSaving(true);
    try {
      await onLogOutreach(lead.id, channel, message, outcome);
      setMessage('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="LOG OUTREACH ACTIVITY"
      subtitle={`LEAD: ${lead.company_name}`}
      maxWidth="max-w-[600px]"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 font-mono text-[11px]">
        {/* Channel Selection */}
        <div className="space-y-1.5 select-none">
          <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Outreach Channel</label>
          <div className="grid grid-cols-3 gap-3">
            {(['email', 'phone', 'social'] as const).map((ch) => {
              const active = channel === ch;
              const icons = {
                email: <Mail className="w-4 h-4 shrink-0" />,
                phone: <Phone className="w-4 h-4 shrink-0" />,
                social: <MessageSquare className="w-4 h-4 shrink-0" />
              };
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-3.5 border rounded flex flex-col items-center justify-center gap-2 cursor-pointer font-bold transition-all duration-300 ${
                    active
                      ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                      : 'border-neutral-800 text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {icons[ch]}
                  <span className="uppercase text-[9px]">{ch}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Outcome Selector */}
        <div className="space-y-1.5 select-none">
          <label className="text-[9px] text-[#00D4FF] font-extrabold uppercase tracking-widest">Logged Outcome</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as any)}
            className="bg-[#080C18] border border-[#00D4FF]/25 text-neutral-350 hover:border-[#00D4FF]/50 text-[11px] font-mono font-bold rounded p-3 w-full outline-none cursor-pointer uppercase transition-colors"
          >
            <option value="no_reply">❓ No Reply</option>
            <option value="interested">👍 Interested / Positive</option>
            <option value="rejected">👎 Rejected / Not Interested</option>
            <option value="booked">📅 Meeting Booked</option>
          </select>
        </div>

        {/* Message body text */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-neutral-455 font-extrabold uppercase tracking-widest">Message Transcript / Activity Log</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-black/60 border border-[#00D4FF]/25 w-full h-[120px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all placeholder-neutral-600 resize-none"
            placeholder="TYPE OUTREACH EMAIL SUBJECT, TEXT, OR PHONE LOG SUMMARY..."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#00D4FF]/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="cyan" loading={saving}>
            <Save className="w-3.5 h-3.5" /> Save Communication Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
