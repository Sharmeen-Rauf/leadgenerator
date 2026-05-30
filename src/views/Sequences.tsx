'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, Play, Pause, Trash2, Edit3, Mail,
  Users, BarChart3, Send, AlertTriangle, Loader2,
  ChevronRight, Clock, CheckCircle2, Activity
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SequenceBuilder, Sequence } from '../components/outreach/SequenceBuilder';
import { Lead } from '../hooks/useLeads';

interface SequencesProps {
  leads: Lead[];
}

export const Sequences: React.FC<SequencesProps> = ({ leads }) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sequences');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSequences(data.sequences || data || []);
    } catch (err) {
      console.error('Fetch sequences error:', err);
      setSequences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to purge this sequence? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sequences?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSequences(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete sequence error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (seq: Sequence) => {
    const newStatus = seq.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/sequences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seq.id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSequences(prev =>
        prev.map(s => (s.id === seq.id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleOpenBuilder = (seq?: Sequence) => {
    setEditingSequence(seq || null);
    setIsBuilderOpen(true);
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    setEditingSequence(null);
    fetchSequences();
  };

  const statusStyles: Record<string, string> = {
    draft: 'border-neutral-700 text-neutral-400 bg-neutral-900/40',
    active: 'border-[#39FF14]/30 text-[#39FF14] bg-[#39FF14]/5 shadow-[0_0_8px_rgba(57,255,20,0.1)]',
    paused: 'border-[#FFB800]/30 text-[#FFB800] bg-[#FFB800]/5 shadow-[0_0_8px_rgba(255,184,0,0.1)]',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Edit3 className="w-3 h-3" />,
    active: <CheckCircle2 className="w-3 h-3 text-[#39FF14]" />,
    paused: <Pause className="w-3 h-3 text-[#FFB800]" />,
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-center select-none font-mono">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00D4FF]" />
            <h2 className="text-sm font-extrabold text-white font-['Syne'] uppercase tracking-wider">Outreach Sequences</h2>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest ml-7">Build and manage automated email drip sequences</p>
        </div>
        <Button variant="cyan" size="sm" onClick={() => handleOpenBuilder()}>
          <Plus className="w-4 h-4" /> Create New
        </Button>
      </div>

      {/* ── Sequences Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="tactical-glass p-5 border-[#00D4FF]/10 h-[240px] animate-pulse">
              <div className="h-4 bg-neutral-800 rounded w-2/3 mb-4" />
              <div className="h-3 bg-neutral-800/60 rounded w-1/2 mb-2" />
              <div className="h-3 bg-neutral-800/60 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-800/60 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : sequences.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 select-none font-mono">
          <AnimatePresence>
            {sequences.map((seq, idx) => (
              <motion.div
                key={seq.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => handleOpenBuilder(seq)}
                className="tactical-glass p-5 border-[#00D4FF]/15 hover:border-[#00D4FF]/35 transition-all duration-300 flex flex-col justify-between h-[260px] cursor-pointer group relative overflow-hidden"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/0 to-[#00D4FF]/0 group-hover:from-[#00D4FF]/3 group-hover:to-transparent transition-all duration-500 pointer-events-none rounded-lg" />

                <div className="relative z-10">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider leading-snug truncate max-w-[180px]">
                      {seq.name}
                    </h4>
                    <span className={`text-[8px] px-2 py-0.5 border rounded-full font-extrabold flex items-center gap-1 leading-none shrink-0 ${statusStyles[seq.status || 'draft']}`}>
                      {statusIcons[seq.status || 'draft']}
                      {(seq.status || 'draft').toUpperCase()}
                    </span>
                  </div>

                  {/* Steps Count */}
                  <div className="flex items-center gap-1.5 mt-3 text-[9px]">
                    <Mail className="w-3 h-3 text-[#00D4FF]" />
                    <span className="text-neutral-500 font-bold uppercase">Steps:</span>
                    <span className="text-[#00D4FF] font-extrabold">{seq.steps?.length || 0} Emails</span>
                  </div>

                  {/* Stats */}
                  <div className="bg-black/40 border border-neutral-800/60 rounded-md p-3 mt-3.5 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500 font-bold uppercase flex items-center gap-1">
                        <Users className="w-3 h-3" /> Enrolled
                      </span>
                      <span className="text-white font-extrabold">{seq.enrolled_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500 font-bold uppercase flex items-center gap-1">
                        <Send className="w-3 h-3" /> Sent
                      </span>
                      <span className="text-white font-extrabold">{seq.sent_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-500 font-bold uppercase flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Reply Rate
                      </span>
                      <span className={`font-extrabold ${
                        (seq.reply_rate || 0) >= 15 ? 'text-[#39FF14]' : (seq.reply_rate || 0) >= 5 ? 'text-[#FFB800]' : 'text-neutral-400'
                      }`}>
                        {seq.reply_rate || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-between items-center mt-4 border-t border-[#00D4FF]/10 pt-3 relative z-10">
                  <div className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {seq.created_at
                      ? new Date(seq.created_at).toLocaleDateString()
                      : 'Draft'}
                  </div>

                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenBuilder(seq)}
                      className="p-1.5 rounded bg-neutral-950 border border-neutral-800 hover:border-[#00D4FF]/50 text-neutral-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                      title="Edit Sequence"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {seq.status !== 'draft' && (
                      <button
                        onClick={() => handleToggleStatus(seq)}
                        className={`p-1.5 rounded bg-neutral-950 border border-neutral-800 transition-colors cursor-pointer ${
                          seq.status === 'active'
                            ? 'hover:border-[#FFB800]/50 text-neutral-400 hover:text-[#FFB800]'
                            : 'hover:border-[#39FF14]/50 text-neutral-400 hover:text-[#39FF14]'
                        }`}
                        title={seq.status === 'active' ? 'Pause Sequence' : 'Resume Sequence'}
                      >
                        {seq.status === 'active' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => seq.id && handleDelete(seq.id)}
                      disabled={deletingId === seq.id}
                      className="p-1.5 rounded bg-neutral-950 border border-neutral-800 hover:border-[#FF3366]/50 text-neutral-400 hover:text-[#FF3366] transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Sequence"
                    >
                      {deletingId === seq.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="tactical-glass p-12 text-center flex flex-col items-center select-none border-[#00D4FF]/10 max-w-md mx-auto mt-12 font-mono"
        >
          <div className="w-16 h-16 rounded-full bg-[#080C18] border-2 border-[#00D4FF]/20 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-[#00D4FF] animate-pulse" />
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">No Sequences Deployed</h4>
          <p className="text-[10px] text-neutral-500 leading-relaxed mb-5 max-w-xs">
            Build automated email drip sequences to nurture leads at scale. Create your first sequence to start converting prospects into clients.
          </p>
          <Button variant="cyan" size="sm" onClick={() => handleOpenBuilder()}>
            <Plus className="w-3.5 h-3.5" /> Create First Sequence
          </Button>

          {/* Decorative stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 w-full border-t border-[#00D4FF]/10 pt-6">
            <div className="text-center">
              <div className="text-[8px] text-neutral-600 font-extrabold uppercase tracking-widest mb-1">Open Rate</div>
              <div className="text-sm font-extrabold text-neutral-700">0%</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-neutral-600 font-extrabold uppercase tracking-widest mb-1">Reply Rate</div>
              <div className="text-sm font-extrabold text-neutral-700">0%</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-neutral-600 font-extrabold uppercase tracking-widest mb-1">Meetings</div>
              <div className="text-sm font-extrabold text-neutral-700">0</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Full-Screen Builder Modal ── */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={handleCloseBuilder}
        title={editingSequence ? 'EDIT OUTREACH SEQUENCE' : 'CREATE OUTREACH SEQUENCE'}
        subtitle={editingSequence ? `EDITING: ${editingSequence.name}` : 'CONFIGURE AUTOMATED EMAIL DRIP PIPELINE'}
        maxWidth="max-w-[900px]"
      >
        <div className="p-6">
          <SequenceBuilder
            leads={leads}
            onClose={handleCloseBuilder}
            existingSequence={editingSequence}
          />
        </div>
      </Modal>
    </div>
  );
};
