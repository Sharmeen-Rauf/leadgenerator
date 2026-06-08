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
    
    // We'll use the free Google Search scraper to bypass the paid rental lock on specific LinkedIn scrapers
    const actorId = 'apify/google-search-scraper';

    console.log(`Scraping jobs for: ${keyword} in ${location} using ${actorId}`);

    const run = await client.actor(actorId).call({
      queries: `site:linkedin.com/jobs/view "${keyword}" "${location}"`,
      maxPagesPerQuery: 1,
      resultsPerPage: Math.max(10, limit)
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    // Parse Google Search results to extract Job info
    let jobs: any[] = [];
    if (items.length > 0 && (items[0] as any).organicResults) {
      jobs = (items[0] as any).organicResults.map((res: any) => {
        let title = keyword;
        let companyName = 'Unknown Company';
        
        // Typical format: "Web Developer - TechCorp - Karachi" or "Web Developer at TechCorp"
        const cleanTitle = res.title.replace(/\| LinkedIn/gi, '').trim();
        const parts = cleanTitle.split(/ - | \| /);
        
        if (parts.length >= 2) {
          title = parts[0].trim();
          companyName = parts[1].trim();
        } else {
          title = cleanTitle;
        }

        if (title.includes(' at ')) {
          const atSplit = title.split(' at ');
          title = atSplit[0].trim();
          companyName = atSplit[1].trim();
        }

        return {
          title: title,
          companyName: companyName,
          location: location,
          url: res.url
        };
      });
    }

    return NextResponse.json({
      success: true,
      jobs: jobs
    });

  } catch (err: any) {
    console.error('Job Scrape Error:', err);
    return NextResponse.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
}
