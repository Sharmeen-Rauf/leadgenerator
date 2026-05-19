import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  try {
    const { companyName, website, city } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'Apify token missing.' }, { status: 500 });
    }

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    console.log(`[Enrich] Starting deep enrichment for: ${companyName}`);

    // Run LinkedIn and Meta Ads scrapers in parallel
    const [linkedinResult, metaResult] = await Promise.allSettled([
      // LinkedIn Decision Maker Scraper
      client.actor('dev_fusion/linkedin-profile-scraper').call({
        searchQueries: [`${companyName} ${city} founder OR owner OR ceo`],
        maxResults: 1,
      }),
      // Meta Ads Scraper
      client.actor('whoareyouanas/meta-ad-scraper').call({
        searchQueries: [companyName],
        maxResults: 1,
      }),
    ]);

    let enrichedData = {
      decisionMaker: 'N/A',
      linkedinUrl: 'N/A',
      title: 'Owner / Founder',
      hasActiveAds: false,
      adCount: 0,
      enrichmentStatus: 'success',
    };

    // Parse LinkedIn results
    if (linkedinResult.status === 'fulfilled') {
      try {
        const { items } = await client.dataset(linkedinResult.value.defaultDatasetId).listItems();
        if (items && items.length > 0) {
          const person: any = items[0];
          enrichedData.decisionMaker = person.fullName || person.name || 'N/A';
          enrichedData.linkedinUrl = person.profileUrl || person.url || 'N/A';
          enrichedData.title = person.headline || person.title || 'Owner / Founder';
        }
      } catch (err: any) {
        console.log(`[Enrich] LinkedIn parsing error: ${err.message}`);
      }
    } else {
      console.log(`[Enrich] LinkedIn actor failed: ${linkedinResult.reason}`);
    }

    // Parse Meta Ads results
    if (metaResult.status === 'fulfilled') {
      try {
        const { items } = await client.dataset(metaResult.value.defaultDatasetId).listItems();
        if (items && items.length > 0) {
          enrichedData.hasActiveAds = true;
          enrichedData.adCount = items.length;
        }
      } catch (err: any) {
        console.log(`[Enrich] Meta Ads parsing error: ${err.message}`);
      }
    } else {
      console.log(`[Enrich] Meta Ads actor failed: ${metaResult.reason}`);
    }

    console.log('[Enrich] Finished', enrichedData);
    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error('Error in enrich API:', error);
    return NextResponse.json({ error: error.message || 'Failed to enrich data.' }, { status: 500 });
  }
}
