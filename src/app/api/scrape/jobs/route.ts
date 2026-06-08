import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Apify API token missing' }, { status: 500 });
  }

  try {
    const { keyword, location, limit = 10 } = await req.json();
    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword and location are required' }, { status: 400 });
    }

    const client = new ApifyClient({ token });
    
    // The user requested a "job scrapper". 
    // We'll use a common LinkedIn Jobs scraper actor, as B2B intent from LinkedIn is highest.
    const actorId = 'rockapis/linkedin-jobs-scraper';

    console.log(`Scraping jobs for: ${keyword} in ${location} using ${actorId}`);

    const run = await client.actor(actorId).call({
      searchTitle: keyword,
      searchLocation: location,
      maxItems: limit
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return NextResponse.json({
      success: true,
      jobs: items
    });

  } catch (err: any) {
    console.error('Job Scrape Error:', err);
    return NextResponse.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
}
