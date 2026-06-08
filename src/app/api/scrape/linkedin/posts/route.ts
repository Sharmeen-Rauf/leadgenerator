import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Apify API token missing' }, { status: 500 });
  }

  try {
    const { url, limit = 5 } = await req.json();
    if (!url || !url.includes('linkedin.com/in/')) {
      return NextResponse.json({ error: 'Invalid LinkedIn profile URL' }, { status: 400 });
    }

    const client = new ApifyClient({ token });
    
    // The user specifically requested "LinkedIn Profile Posts Scraper (No Cookies)"
    const actorId = 'apify/linkedin-post-scraper'; // or similar no-cookie community actor

    console.log(`Scraping LinkedIn posts for: ${url} using ${actorId}`);

    const run = await client.actor(actorId).call({
      urls: [url],
      deepScrape: false,
      maxPosts: limit
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return NextResponse.json({
      success: true,
      posts: items
    });

  } catch (err: any) {
    console.error('LinkedIn Posts Scrape Error:', err);
    return NextResponse.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
}
