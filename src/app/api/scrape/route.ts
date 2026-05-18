import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
  try {
    const { prompt, location, niche, advanced } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'Apify token missing.' }, { status: 500 });
    }

    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const searchString = `${niche || ''} in ${location || ''} ${prompt || ''}`.trim();
    
    // We use the popular Google Maps Scraper for lead generation
    const input = {
      searchStringsArray: [searchString],
      maxCrawledPlacesPerSearch: 20, // limit for fast response during demo
      language: 'en',
      maxImages: 0,
      maxReviews: 0,
      scrapeWebsite: true,
      extractEmailsAndContacts: true,
    };

    console.log('Starting Apify task with input:', input);

    // Call the actor
    const run = await client.actor('compass/crawler-google-places').call(input);

    console.log('Apify task finished:', run.id);

    // Fetch the results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Clean, structure, and score the data
    const leads = items.map((item: any) => {
      let score = 0;
      const website = item.website || 'N/A';
      const phone = item.phone || item.phoneUnformatted || 'N/A';
      
      let email = 'N/A';
      let decisionMaker = 'N/A';
      let directEmail = 'N/A';

      if (item.emails && item.emails.length > 0) {
        email = item.emails[0];
        
        // Try to find a personal email for the Decision Maker
        const genericPrefixes = ['info', 'contact', 'sales', 'support', 'admin', 'hello', 'office', 'enquiries'];
        for (const e of item.emails) {
          const prefix = e.split('@')[0].toLowerCase();
          if (!genericPrefixes.includes(prefix)) {
            decisionMaker = prefix.charAt(0).toUpperCase() + prefix.slice(1); // Capitalize name
            directEmail = e;
            break;
          }
        }
      } else if (item.email) {
        email = item.email;
      }

      const category = item.categoryName || 'N/A';
      const rating = item.totalScore || 0;
      const reviews = item.reviewsCount || 0;

      // Mock social presence consistently based on length
      const hasFb = website !== 'N/A' || item.title.length % 2 === 0;
      const hasInsta = website !== 'N/A' && item.title.length % 3 === 0;
      
      const social = { fb: hasFb, insta: hasInsta, google: true };

      // Scoring Algorithm based on BANT & Financial Stability proxies
      if (website !== 'N/A') score += 25; // Digital Presence
      if (phone !== 'N/A') score += 25; // Accessibility
      if (rating >= 4.0) score += 20; // Good Reputation (Quality)
      if (reviews >= 50) score += 20; // Established/Stable Business
      if (category !== 'N/A') score += 10; // Defined niche fit
      if (!social.insta) score -= 5;
      if (!social.fb) score -= 5;

      // Limit score to 99 max
      score = Math.max(0, Math.min(99, score));

      let temperature = 'Cold';
      if (score >= 70) temperature = 'Hot';
      else if (score >= 40) temperature = 'Warm';

      // PitchRadar Opportunity Detection
      const opps: string[] = [];
      if (website === 'N/A') opps.push('web');
      if (rating < 4.0) opps.push('seo');
      if (!social.insta || !social.fb) opps.push('social');
      if (reviews < 30) opps.push('ads');
      if (rating < 3.5) opps.push('email');

      return {
        companyName: item.title,
        website,
        phone,
        email,
        decisionMaker,
        directEmail,
        address: item.address || 'N/A',
        city: location || 'N/A',
        category,
        rating: rating || 0,
        reviews,
        url: item.url || '',
        social,
        score,
        temperature,
        opps
      };
    });

    // Sort leads so Hot ones appear first
    leads.sort((a, b) => b.score - a.score);

    // Simple AI insights placeholder
    const hotLeadsCount = leads.filter((l: any) => l.temperature === 'Hot').length;
    const insights = `Found ${leads.length} records for "${searchString}". ${hotLeadsCount} of them are identified as "Hot" leads based on their digital presence and reputation. The average rating is ${
      leads.length > 0
        ? (leads.reduce((acc: number, val: any) => acc + (parseFloat(val.rating) || 0), 0) / leads.length).toFixed(1)
        : 'N/A'
    }.`;

    return NextResponse.json({ leads, insights });
  } catch (error: any) {
    console.error('Error in scrape API:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape data.' }, { status: 500 });
  }
}
