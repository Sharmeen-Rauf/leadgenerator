// =============================================================================
// PitchRadar — Sequence Enrollment Management
// GET/POST/PUT /api/sequences/enroll
// Manages lead enrollments in outreach sequences
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
              process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, key);
}

// ─── GET: List enrollments for a sequence ────────────────────────────────────

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const sequenceId = searchParams.get('sequence_id');

    if (!sequenceId) {
      return NextResponse.json({ error: 'sequence_id query parameter is required' }, { status: 400 });
    }

    const { data: enrollments, error } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return setup SQL
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          enrollments: [],
          setup_required: true,
          setup_sql: `-- Run this in your Supabase SQL Editor:
CREATE TABLE sequence_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_step INT NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  UNIQUE(sequence_id, lead_id)
);

-- Enable RLS
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon users (adjust for your auth setup)
CREATE POLICY "Allow all for sequence_enrollments" ON sequence_enrollments
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_enrollments_lead ON sequence_enrollments(lead_id);`
        });
      }
      throw error;
    }

    // Enrich with lead names by fetching from leads table
    const leadIds = (enrollments || []).map(e => e.lead_id);
    let leadsMap: Record<string, { company_name: string; email: string; opportunity_temp: string }> = {};

    if (leadIds.length > 0) {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, company_name, email, opportunity_temp')
        .in('id', leadIds);

      if (leads) {
        for (const lead of leads) {
          leadsMap[lead.id] = {
            company_name: lead.company_name,
            email: lead.email,
            opportunity_temp: lead.opportunity_temp,
          };
        }
      }
    }

    const enriched = (enrollments || []).map(enrollment => ({
      ...enrollment,
      lead: leadsMap[enrollment.lead_id] || { company_name: 'Unknown', email: 'N/A', opportunity_temp: 'cold' },
    }));

    return NextResponse.json({ enrollments: enriched });
  } catch (err: any) {
    console.error('Enrollments GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// ─── POST: Enroll leads into a sequence ──────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { sequence_id, lead_ids } = body;

    if (!sequence_id || typeof sequence_id !== 'string') {
      return NextResponse.json({ error: 'sequence_id is required' }, { status: 400 });
    }

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids must be a non-empty array' }, { status: 400 });
    }

    // Verify the sequence exists
    const { data: sequence, error: seqError } = await supabase
      .from('outreach_sequences')
      .select('id, steps')
      .eq('id', sequence_id)
      .single();

    if (seqError || !sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Calculate first send time (now + delay of first step)
    const firstStep = Array.isArray(sequence.steps) ? sequence.steps[0] : null;
    const firstDelay = firstStep?.delay_days || 0;
    const nextSend = new Date();
    nextSend.setDate(nextSend.getDate() + firstDelay);

    const now = new Date().toISOString();

    // Create enrollment records (upsert to avoid duplicates)
    const records = lead_ids.map((leadId: string) => ({
      sequence_id,
      lead_id: leadId,
      status: 'active',
      current_step: 0,
      enrolled_at: now,
      next_send_at: nextSend.toISOString(),
    }));

    const { data, error } = await supabase
      .from('sequence_enrollments')
      .upsert(records, { onConflict: 'sequence_id,lead_id' })
      .select();

    if (error) throw error;

    return NextResponse.json({
      enrolled: data?.length || 0,
      enrollments: data,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Enrollments POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to enroll leads' }, { status: 500 });
  }
}

// ─── PUT: Update an enrollment status ────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { enrollment_id, status, current_step } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id is required' }, { status: 400 });
    }

    const validStatuses = ['active', 'paused', 'completed', 'bounced', 'replied'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `status must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (current_step !== undefined) updateData.current_step = current_step;
    if (status === 'completed' || current_step !== undefined) {
      updateData.last_sent_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('sequence_enrollments')
      .update(updateData)
      .eq('id', enrollment_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ enrollment: data });
  } catch (err: any) {
    console.error('Enrollments PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update enrollment' }, { status: 500 });
  }
}
