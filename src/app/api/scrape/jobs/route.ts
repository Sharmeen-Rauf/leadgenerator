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
    // We'll use a reliable, active LinkedIn Jobs scraper actor on Apify.
    const actorId = 'bebity/linkedin-jobs-scraper';

    console.log(`Scraping jobs for: ${keyword} in ${location} using ${actorId}`);

    const run = await client.actor(actorId).call({
      includeKeyword: keyword,
      locationName: location,
      count: limit,
      scrapeCompany: false
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
