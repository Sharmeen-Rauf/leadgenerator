// =============================================================================
// PitchRadar — Outreach Sequences CRUD
// GET/POST/PUT/DELETE /api/sequences
// Manages email outreach sequences stored in Supabase
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

// ─── GET: List all sequences ─────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = getSupabase();
    
    const { data: sequences, error } = await supabase
      .from('outreach_sequences')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array with setup instructions
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          sequences: [],
          setup_required: true,
          setup_sql: `-- Run this in your Supabase SQL Editor:
CREATE TABLE outreach_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon users (adjust for your auth setup)
CREATE POLICY "Allow all for outreach_sequences" ON outreach_sequences
  FOR ALL USING (true) WITH CHECK (true);`
        });
      }
      throw error;
    }

    // Get enrollment counts for each sequence
    const sequenceIds = (sequences || []).map(s => s.id);
    let enrollmentCounts: Record<string, number> = {};

    if (sequenceIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('sequence_enrollments')
        .select('sequence_id')
        .in('sequence_id', sequenceIds);

      if (enrollments) {
        for (const e of enrollments) {
          enrollmentCounts[e.sequence_id] = (enrollmentCounts[e.sequence_id] || 0) + 1;
        }
      }
    }

    const enriched = (sequences || []).map(seq => ({
      ...seq,
      enrollment_count: enrollmentCounts[seq.id] || 0,
      step_count: Array.isArray(seq.steps) ? seq.steps.length : 0,
    }));

    return NextResponse.json({ sequences: enriched });
  } catch (err: any) {
    console.error('Sequences GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch sequences' }, { status: 500 });
  }
}

// ─── POST: Create a new sequence ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const { name, steps, status } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'steps must be a non-empty array' }, { status: 400 });
    }

    // Validate each step
    for (const step of steps) {
      if (typeof step.delay_days !== 'number' || step.delay_days < 0) {
        return NextResponse.json({ error: 'Each step must have a valid delay_days (>=0)' }, { status: 400 });
      }
      if (!step.subject || !step.body) {
        return NextResponse.json({ error: 'Each step must have subject and body' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('outreach_sequences')
      .insert({
        name: name.trim(),
        steps,
        status: status || 'draft',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sequence: data }, { status: 201 });
  } catch (err: any) {
    console.error('Sequences POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create sequence' }, { status: 500 });
  }
}

// ─── PUT: Update a sequence ──────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { id, name, steps, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (steps !== undefined) updateData.steps = steps;
    if (status !== undefined) {
      if (!['draft', 'active', 'paused'].includes(status)) {
        return NextResponse.json({ error: 'status must be draft, active, or paused' }, { status: 400 });
      }
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from('outreach_sequences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ sequence: data });
  } catch (err: any) {
    console.error('Sequences PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update sequence' }, { status: 500 });
  }
}

// ─── DELETE: Delete a sequence ───────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    // Delete associated enrollments first
    await supabase
      .from('sequence_enrollments')
      .delete()
      .eq('sequence_id', id);

    const { error } = await supabase
      .from('outreach_sequences')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Sequences DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete sequence' }, { status: 500 });
  }
}
