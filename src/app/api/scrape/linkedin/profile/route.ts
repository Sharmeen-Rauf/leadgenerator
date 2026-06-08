import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Apify API token missing' }, { status: 500 });
  }

  try {
    const { url } = await req.json();
    if (!url || !url.includes('linkedin.com/in/')) {
      return NextResponse.json({ error: 'Invalid LinkedIn profile URL' }, { status: 400 });
    }

    const client = new ApifyClient({ token });
    
    // We use a generic "No Cookies" LinkedIn profile scraper actor
    // The user specifically requested "LinkedIn Profile Scraper + Email ✅ No Cookies"
    // Commonly this maps to an actor like 'harvestapi/linkedin-profile-scraper'
    const actorId = 'harvestapi/linkedin-profile-scraper';

    console.log(`Deep scraping LinkedIn profile: ${url} using ${actorId}`);

    const run = await client.actor(actorId).call({
      urls: [url],
      extractEmails: true,
      minDelay: 1,
      maxDelay: 3
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items.length === 0) {
      return NextResponse.json({ error: 'No data extracted from profile' }, { status: 404 });
    }

    const profileData = items[0];

    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (err: any) {
    console.error('LinkedIn Profile Scrape Error:', err);
    return NextResponse.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
}
