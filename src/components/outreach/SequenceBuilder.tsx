'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Plus, X, Eye, EyeOff, Save, Users, Flame,
  Send, GripVertical, Clock, ChevronDown, Type, Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Lead } from '../../hooks/useLeads';

interface SequenceBuilderProps {
  leads: Lead[];
  onClose?: () => void;
  existingSequence?: Sequence | null;
}

interface EmailStep {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
}

export interface Sequence {
  id?: string;
  name: string;
  steps: EmailStep[];
  status?: 'draft' | 'active' | 'paused';
  enrolled_count?: number;
  sent_count?: number;
  reply_rate?: number;
  created_at?: string;
}

const DELAY_OPTIONS = [0, 1, 2, 3, 5, 7, 14, 21, 30];

const MERGE_FIELDS = [
  { label: '{{company_name}}', value: '{{company_name}}' },
  { label: '{{decision_maker}}', value: '{{decision_maker}}' },
  { label: '{{email}}', value: '{{email}}' },
  { label: '{{website}}', value: '{{website}}' },
  { label: '{{gaps}}', value: '{{gaps}}' },
  { label: '{{location}}', value: '{{location}}' },
  { label: '{{score}}', value: '{{score}}' },
];

const generateId = () => Math.random().toString(36).slice(2, 10);

const createDefaultStep = (index: number): EmailStep => ({
  id: generateId(),
  delayDays: index === 0 ? 0 : index === 1 ? 3 : 7,
  subject: '',
  body: '',
});

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({
  leads,
  onClose,
  existingSequence,
}) => {
  const [sequenceName, setSequenceName] = useState(existingSequence?.name || '');
  const [steps, setSteps] = useState<EmailStep[]>(
    existingSequence?.steps?.length
      ? existingSequence.steps
      : [createDefaultStep(0)]
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const subjectRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const sampleLead = useMemo(() => {
    if (leads.length > 0) return leads[0];
    return {
      company_name: 'Acme Dental Studio',
      email: 'hello@acmedental.com',
      website: 'acmedental.com',
      gaps: ['SEO', 'ADS'],
      location: 'Austin, TX',
      ai_score: 78,
      niche: 'Dentist',
    } as Partial<Lead>;
  }, [leads]);

  const hotLeadsCount = useMemo(
    () => leads.filter(l => l.opportunity_temp === 'hot').length,
    [leads]
  );

  const insertMergeField = (stepId: string, field: string, target: 'subject' | 'body') => {
    if (target === 'subject') {
      const el = subjectRefs.current[stepId];
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const current = el.value;
        const updated = current.slice(0, start) + field + current.slice(end);
        setSteps(prev =>
          prev.map(s => (s.id === stepId ? { ...s, subject: updated } : s))
        );
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + field.length, start + field.length);
        }, 0);
      }
    } else {
      const el = bodyRefs.current[stepId];
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const current = el.value;
        const updated = current.slice(0, start) + field + current.slice(end);
        setSteps(prev =>
          prev.map(s => (s.id === stepId ? { ...s, body: updated } : s))
        );
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + field.length, start + field.length);
        }, 0);
      }
    }
  };

  const addStep = () => {
    setSteps(prev => [...prev, createDefaultStep(prev.length)]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: keyof EmailStep, value: any) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const renderMergedContent = (text: string) => {
    if (!sampleLead) return text;
    return text
      .replace(/\{\{company_name\}\}/g, sampleLead.company_name || 'Acme Corp')
      .replace(/\{\{decision_maker\}\}/g, 'John Smith')
      .replace(/\{\{email\}\}/g, sampleLead.email || 'contact@example.com')
      .replace(/\{\{website\}\}/g, sampleLead.website || 'example.com')
      .replace(/\{\{gaps\}\}/g, (sampleLead.gaps || ['SEO']).join(', '))
      .replace(/\{\{location\}\}/g, sampleLead.location || 'Unknown')
      .replace(/\{\{score\}\}/g, String(sampleLead.ai_score || 75));
  };

  const handleSaveSequence = async () => {
    if (!sequenceName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...(existingSequence?.id ? { id: existingSequence.id } : {}),
        name: sequenceName,
        steps,
        status: existingSequence?.status || 'draft',
      };

      const method = existingSequence?.id ? 'PUT' : 'POST';
      const res = await fetch('/api/sequences', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save sequence');
    } catch (err) {
      console.error('Save sequence error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (filter: 'all' | 'hot') => {
    setEnrolling(true);
    try {
      const targetLeads = filter === 'hot'
        ? leads.filter(l => l.opportunity_temp === 'hot')
        : leads;

      const res = await fetch('/api/sequences/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceId: existingSequence?.id,
          sequenceName,
          leadIds: targetLeads.map(l => l.id),
        }),
      });

      if (!res.ok) throw new Error('Failed to enroll leads');
    } catch (err) {
      console.error('Enroll error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-5 select-none font-mono">
      {/* ── Header ── */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15">
        <div className="flex items-center justify-between border-b border-[#00D4FF]/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4.5 h-4.5 text-[#00D4FF]" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              {existingSequence ? 'Edit Outreach Sequence' : 'Build Outreach Sequence'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                previewMode
                  ? 'bg-[#00D4FF]/15 border-[#00D4FF] text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white'
              }`}
            >
              {previewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 bg-neutral-900 border border-neutral-800 hover:border-[#FF3366]/50 rounded flex items-center justify-center text-neutral-400 hover:text-[#FF3366] transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sequence Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest">Sequence Identifier Name</label>
          <input
            type="text"
            value={sequenceName}
            onChange={e => setSequenceName(e.target.value)}
            className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold transition-all uppercase"
            placeholder="e.g. SEO AUDIT DRIP — DENTISTS Q2"
          />
        </div>
      </div>

      {/* ── Steps Timeline ── */}
      <div className="relative">
        {/* Vertical connector line */}
        {steps.length > 1 && (
          <div
            className="absolute left-[19px] top-8 w-[2px] border-l-2 border-dashed border-[#00D4FF]/25 z-0"
            style={{ height: `calc(100% - 80px)` }}
          />
        )}

        <div className="space-y-4 relative z-10">
          <AnimatePresence>
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex gap-4"
              >
                {/* Step Number Badge */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[38px] h-[38px] rounded-full bg-[#080C18] border-2 border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] text-xs font-extrabold shadow-[0_0_12px_rgba(0,212,255,0.1)]">
                    {idx + 1}
                  </div>
                </div>

                {/* Step Card */}
                <div className="flex-1 tactical-glass p-5 border-[#00D4FF]/15 hover:border-[#00D4FF]/25 transition-all duration-300">
                  {previewMode ? (
                    /* ── Preview Mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="cyan">STEP {idx + 1}</Badge>
                          <Badge variant="muted">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            Day {step.delayDays}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-neutral-800/60 rounded-md p-4 space-y-2">
                        <div className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">Subject</div>
                        <div className="text-[11px] text-white font-semibold">
                          {renderMergedContent(step.subject) || '(No subject)'}
                        </div>
                      </div>

                      <div className="bg-black/40 border border-neutral-800/60 rounded-md p-4 space-y-2">
                        <div className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">Body</div>
                        <div className="text-[10.5px] text-neutral-300 whitespace-pre-wrap leading-relaxed select-text">
                          {renderMergedContent(step.body) || '(No body content)'}
                        </div>
                      </div>

                      {sampleLead && (
                        <div className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest text-right">
                          Preview using: {sampleLead.company_name}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Edit Mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="cyan">STEP {idx + 1}</Badge>
                          {/* Delay Selector */}
                          <div className="relative">
                            <select
                              value={step.delayDays}
                              onChange={e => updateStep(step.id, 'delayDays', Number(e.target.value))}
                              className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-2.5 py-1 text-[10px] text-neutral-300 font-bold outline-none cursor-pointer appearance-none pr-6 uppercase"
                            >
                              {DELAY_OPTIONS.map(d => (
                                <option key={d} value={d}>
                                  {d === 0 ? 'Immediately' : `Day ${d}`}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
                          </div>
                        </div>

                        {steps.length > 1 && (
                          <button
                            onClick={() => removeStep(step.id)}
                            className="w-6 h-6 bg-neutral-900 border border-neutral-800 hover:border-[#FF3366]/50 rounded flex items-center justify-center text-neutral-500 hover:text-[#FF3366] transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Merge Fields Toolbar */}
                      <div className="space-y-1">
                        <div className="text-[8px] text-neutral-600 font-extrabold uppercase tracking-widest">Merge Fields — click to insert</div>
                        <div className="flex flex-wrap gap-1.5">
                          {MERGE_FIELDS.map(mf => (
                            <button
                              key={mf.value}
                              onClick={() => insertMergeField(step.id, mf.value, 'body')}
                              className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#00D4FF]/8 text-[#00D4FF]/80 border border-[#00D4FF]/15 hover:bg-[#00D4FF]/15 hover:text-[#00D4FF] transition-all cursor-pointer"
                            >
                              {mf.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block">
                          <Type className="w-2.5 h-2.5 inline mr-1" />
                          Subject Line
                        </label>
                        <input
                          ref={el => { subjectRefs.current[step.id] = el; }}
                          type="text"
                          value={step.subject}
                          onChange={e => updateStep(step.id, 'subject', e.target.value)}
                          className="bg-black/60 border border-[#00D4FF]/25 w-full rounded px-3 py-2 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none"
                          placeholder="e.g. Critical SEO Gaps Detected on {{company_name}}"
                        />
                      </div>

                      {/* Body Textarea */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block">Email Body</label>
                        <textarea
                          ref={el => { bodyRefs.current[step.id] = el; }}
                          value={step.body}
                          onChange={e => updateStep(step.id, 'body', e.target.value)}
                          className="bg-black/60 border border-[#00D4FF]/25 w-full h-[140px] rounded p-3 text-[10.5px] font-semibold text-white focus:border-[#00D4FF] outline-none resize-none select-text"
                          placeholder="Write your email body here. Use merge fields above to personalize..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Step Button */}
        {!previewMode && (
          <div className="flex items-center gap-4 mt-4 pl-[54px]">
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-4 py-2.5 rounded border-2 border-dashed border-[#00D4FF]/20 text-[10px] font-extrabold uppercase tracking-wider text-[#00D4FF]/60 hover:text-[#00D4FF] hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/5 transition-all cursor-pointer w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" /> Add Email Step
            </button>
          </div>
        )}
      </div>

      {/* ── Save & Enroll Section ── */}
      <div className="tactical-glass p-5 border-[#00D4FF]/15">
        <div className="flex items-center gap-2 border-b border-[#00D4FF]/10 pb-3 mb-4">
          <Send className="w-4 h-4 text-[#39FF14]" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Save & Deploy</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Save Section */}
          <div className="bg-black/40 border border-neutral-800/60 rounded-md p-4 space-y-3">
            <div className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">Sequence Configuration</div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 font-bold uppercase">Steps:</span>
              <Badge variant="cyan">{steps.length} EMAIL{steps.length !== 1 ? 'S' : ''}</Badge>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 font-bold uppercase">Status:</span>
              <Badge variant={existingSequence?.status === 'active' ? 'green' : 'muted'}>
                {existingSequence?.status?.toUpperCase() || 'DRAFT'}
              </Badge>
            </div>
            <Button
              variant="cyan"
              size="sm"
              onClick={handleSaveSequence}
              loading={saving}
              disabled={saving || !sequenceName.trim()}
              className="w-full"
            >
              <Save className="w-3.5 h-3.5" />
              {existingSequence?.id ? 'Update Sequence' : 'Save Sequence'}
            </Button>
          </div>

          {/* Enroll Section */}
          <div className="bg-black/40 border border-neutral-800/60 rounded-md p-4 space-y-3">
            <div className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">Lead Enrollment</div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 font-bold uppercase">Available Leads:</span>
              <Badge variant="cyan">
                <Users className="w-2.5 h-2.5 mr-1" />
                {leads.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 font-bold uppercase">Hot Leads:</span>
              <Badge variant="pink">
                <Flame className="w-2.5 h-2.5 mr-1" />
                {hotLeadsCount}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="pink"
                size="sm"
                onClick={() => handleEnroll('hot')}
                loading={enrolling}
                disabled={enrolling || hotLeadsCount === 0}
                className="flex-1"
              >
                <Flame className="w-3.5 h-3.5" /> Enroll Hot ({hotLeadsCount})
              </Button>
              <Button
                variant="green"
                size="sm"
                onClick={() => handleEnroll('all')}
                loading={enrolling}
                disabled={enrolling || leads.length === 0}
                className="flex-1"
              >
                <Users className="w-3.5 h-3.5" /> Enroll All ({leads.length})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
