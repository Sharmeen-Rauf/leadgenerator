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

    // Run all three enrichment scrapers in parallel
    const [linkedinResult, metaResult, linkedinPostsResult] = await Promise.allSettled([
      // 1. LinkedIn Profile Scraper (NO COOKIES REQUIRED — apimaestro)
      client.actor('apimaestro/linkedin-profile-batch-scraper-no-cookies-required').call({
        usernames: [
          `${companyName.toLowerCase().replace(/\s+/g, '-')}-${city?.toLowerCase().replace(/\s+/g, '-') || ''}`,
        ],
      }),
      // 2. Meta Ads Scraper
      client.actor('whoareyouanas/meta-ad-scraper').call({
        searchQueries: [companyName],
        maxResults: 1,
      }),
      // 3. LinkedIn Post Comments & Engagements Scraper (NO COOKIES)
      client.actor('apimaestro/linkedin-post-comments-replies-engagements-scraper-no-cookies').call({
        postIds: [],
      }),
    ]);

    let enrichedData: any = {
      decisionMaker: 'N/A',
      linkedinUrl: 'N/A',
      title: 'Owner / Founder',
      hasActiveAds: false,
      adCount: 0,
      linkedinEngagement: null,
      enrichmentStatus: 'success',
    };

    // --- PARSE LINKEDIN PROFILE RESULTS ---
    if (linkedinResult.status === 'fulfilled') {
      try {
        const { items } = await client.dataset(linkedinResult.value.defaultDatasetId).listItems();
        if (items && items.length > 0) {
          const person: any = items[0];
          enrichedData.decisionMaker = person.fullName || person.name || person.firstName
            ? `${person.firstName || ''} ${person.lastName || ''}`.trim()
            : 'N/A';
          enrichedData.linkedinUrl = person.profileUrl || person.url || person.linkedinUrl || 'N/A';
          enrichedData.title = person.headline || person.title || person.occupation || 'Owner / Founder';
          
          // Extra profile data from apimaestro actor
          if (person.summary) enrichedData.summary = person.summary;
          if (person.connections) enrichedData.connections = person.connections;
          if (person.followerCount) enrichedData.followers = person.followerCount;
          if (person.experienceCount) enrichedData.experienceCount = person.experienceCount;
          if (person.educationCount) enrichedData.educationCount = person.educationCount;
          if (person.location) enrichedData.location = person.location;
          if (person.profilePicture || person.profilePictureUrl) {
            enrichedData.profilePicture = person.profilePicture || person.profilePictureUrl;
          }
        }
      } catch (err: any) {
        console.log(`[Enrich] LinkedIn parsing error: ${err.message}`);
      }
    } else {
      console.log(`[Enrich] LinkedIn actor failed: ${linkedinResult.reason}`);
    }

    // --- PARSE META ADS RESULTS ---
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

    // --- PARSE LINKEDIN ENGAGEMENT RESULTS ---
    if (linkedinPostsResult.status === 'fulfilled') {
      try {
        const { items } = await client.dataset(linkedinPostsResult.value.defaultDatasetId).listItems();
        if (items && items.length > 0) {
          enrichedData.linkedinEngagement = {
            totalComments: items.length,
            recentActivity: true,
          };
        }
      } catch (err: any) {
        console.log(`[Enrich] LinkedIn engagement parsing error: ${err.message}`);
      }
    }

    console.log('[Enrich] Finished', JSON.stringify(enrichedData, null, 2));
    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error('Error in enrich API:', error);
    return NextResponse.json({ error: error.message || 'Failed to enrich data.' }, { status: 500 });
  }
}
