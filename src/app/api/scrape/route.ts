import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Start the scraping job on the Python backend
    const startRes = await fetch(`${BACKEND_URL}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const startData = await startRes.json();
    if (!startRes.ok) throw new Error(startData.detail || 'Backend error');

    const jobId = startData.job_id;

    // Poll for completion (max 120 seconds)
    const maxWait = 120;
    const pollInterval = 2;
    let elapsed = 0;

    while (elapsed < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
      elapsed += pollInterval;

      const pollRes = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
      const pollData = await pollRes.json();

      if (pollData.status === 'completed') {
        return NextResponse.json({
          leads: pollData.leads || [],
          insights: pollData.insights || '',
          job_id: jobId,
        });
      }

      if (pollData.status === 'error') {
        throw new Error(pollData.error || 'Pipeline failed');
      }

      console.log(`[Proxy] Job ${jobId} — ${pollData.step} (${pollData.progress}%)`);
    }

    throw new Error('Scraping timed out after 120 seconds');

  } catch (error: any) {
    console.error('Error in scrape proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape data.' },
      { status: 500 }
    );
  }
}
