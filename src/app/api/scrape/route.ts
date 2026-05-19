import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  try {
    const { niche, location, prompt } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'Apify API token is not configured.' }, { status: 500 });
    }

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const searchQuery = prompt || `${niche} in ${location}`;
    console.log(`[Scrape] Starting Apify search: "${searchQuery}"`);

    // Run Google Maps Scraper on Apify
    const run = await client.actor('compass/crawler-google-places').call({
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: 20,
      language: 'en',
      scrapeContacts: true,
      scrapeWebsite: true,
      extractEmailsAndContacts: true,
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Scrape] Got ${items.length} raw results from Apify`);

    // Transform into our lead format
    const leads = items.map((item: any, index: number) => {
      const emails = item.emails || [];
      const phone = item.phone || item.phoneUnformatted || 'N/A';
      const website = item.website || item.url || 'N/A';
      const rating = item.totalScore || item.rating || 0;
      const reviews = item.reviewsCount || 0;

      // Decision maker detection from email
      let decisionMaker = 'N/A';
      let directEmail = 'N/A';
      const genericPrefixes = ['info', 'contact', 'sales', 'support', 'admin', 'hello', 'office', 'enquiries', 'team', 'service', 'mail', 'help'];

      if (emails.length > 0) {
        for (const email of emails) {
          const prefix = email.split('@')[0].toLowerCase();
          if (!genericPrefixes.includes(prefix)) {
            directEmail = email;
            decisionMaker = prefix
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
            break;
          }
        }
        if (directEmail === 'N/A') {
          directEmail = emails[0];
        }
      }

      // Opportunity detection
      const opps: string[] = [];
      if (!website || website === 'N/A') opps.push('web');
      if (rating < 4.0 && rating > 0) opps.push('seo');
      if (!item.facebookUrl && !item.instagramUrl) opps.push('social');
      if (reviews < 30) opps.push('ads');
      if (emails.length === 0) opps.push('email');

      // Scoring
      let score = 0;
      if (!website || website === 'N/A') score += 30;
      if (rating < 4.0 && rating > 0) score += 20;
      if (rating < 3.5 && rating > 0) score += 10;
      if (reviews < 10) score += 10;
      if (reviews < 30) score += 5;
      if (emails.length === 0) score += 10;
      if (!item.facebookUrl) score += 5;
      if (!item.instagramUrl) score += 5;
      if (opps.length >= 3) score += 5;
      score = Math.min(score, 99);

      let temperature = 'Cold';
      if (score >= 70) temperature = 'Hot';
      else if (score >= 40) temperature = 'Warm';

      return {
        companyName: item.title || item.name || 'Unknown',
        category: item.categoryName || item.categories?.[0] || 'N/A',
        address: item.address || item.street || 'N/A',
        city: item.city || location || 'N/A',
        phone,
        website,
        email: emails[0] || 'N/A',
        rating,
        reviews,
        score,
        temperature,
        opps,
        decisionMaker,
        directEmail,
        social: {
          fb: !!item.facebookUrl,
          insta: !!item.instagramUrl,
          google: true,
        },
      };
    });

    // Sort by score descending
    leads.sort((a: any, b: any) => b.score - a.score);

    const hotCount = leads.filter((l: any) => l.temperature === 'Hot').length;
    const insights = `Found ${leads.length} businesses for "${searchQuery}". ${hotCount} identified as Hot leads. Average rating: ${leads.length ? (leads.reduce((s: number, l: any) => s + (l.rating || 0), 0) / leads.length).toFixed(1) : 0}.`;

    return NextResponse.json({ leads, insights });
  } catch (error: any) {
    console.error('Error in scrape API:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape data.' }, { status: 500 });
  }
}
