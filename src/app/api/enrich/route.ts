import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Backend enrichment error');

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in enrich proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich data.' },
      { status: 500 }
    );
  }
}
