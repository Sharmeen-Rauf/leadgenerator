import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// ========== INLINE WEBSITE ANALYZER (FAST — no Apify needed) ==========

async function analyzeWebsite(url: string): Promise<any> {
  if (!url || url === 'N/A') {
    return { exists: false, score: 0, cms: null, seo: { seo_score: 0 }, social: {}, analytics: [], pixels: [], opportunities: ['No website — biggest opportunity'] };
  }
  if (!url.startsWith('http')) url = `https://${url}`;

  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    const loadTime = Date.now() - start;
    const html = await res.text();

    // CMS Detection
    const cmsChecks: [string, string[]][] = [
      ['WordPress', ['wp-content', 'wp-includes']],
      ['Shopify', ['shopify.com', 'cdn.shopify']],
      ['Wix', ['wix.com', 'wixsite.com', '_wixCIDX']],
      ['Squarespace', ['squarespace.com', 'static.squarespace']],
      ['Webflow', ['webflow.com', 'webflow.io']],
      ['Joomla', ['joomla', '/components/com_']],
      ['Drupal', ['Drupal.settings']],
      ['WooCommerce', ['woocommerce', 'wc-api']],
      ['GoDaddy', ['godaddy.com', 'godaddysites.com']],
    ];
    let cms = 'Custom/Unknown';
    const htmlLower = html.toLowerCase();
    for (const [name, signals] of cmsChecks) {
      if (signals.some(s => htmlLower.includes(s.toLowerCase()))) { cms = name; break; }
    }

    // Analytics
    const analytics: string[] = [];
    if (html.includes('gtag(') || html.includes('google-analytics.com')) analytics.push('Google Analytics');
    if (html.includes('googletagmanager.com')) analytics.push('Google Tag Manager');
    if (html.includes('hotjar.com')) analytics.push('Hotjar');
    if (html.includes('clarity.ms')) analytics.push('Microsoft Clarity');

    // Tracking Pixels
    const pixels: string[] = [];
    if (html.includes('fbq(') || html.includes('fbevents')) pixels.push('Facebook Pixel');
    if (html.includes('snap.licdn.com')) pixels.push('LinkedIn Pixel');
    if (html.includes('tiktok.com/i18n/pixel')) pixels.push('TikTok Pixel');
    if (html.includes('googleadservices.com')) pixels.push('Google Ads');

    // Social Links
    const social: Record<string, boolean> = {};
    social.facebook = /facebook\.com\/(?!sharer|share|plugins)[\w.-]+/i.test(html);
    social.instagram = /instagram\.com\/[\w.-]+/i.test(html);
    social.twitter = /(?:twitter|x)\.com\/[\w.-]+/i.test(html);
    social.linkedin = /linkedin\.com\/(?:company|in)\/[\w.-]+/i.test(html);
    social.youtube = /youtube\.com\/(?:channel|c|user|@)[\w.-]+/i.test(html);
    social.tiktok = /tiktok\.com\/@[\w.-]+/i.test(html);

    // SEO
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const titleText = titleMatch ? titleMatch[1].trim() : null;
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const descText = descMatch ? descMatch[1].trim() : null;
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    const hasOG = /property=["']og:/i.test(html);
    const hasSchema = html.includes('application/ld+json');
    
    let seoScore = 0;
    if (titleText && titleText.length > 30 && titleText.length < 65) seoScore += 20;
    if (descText && descText.length > 100 && descText.length < 160) seoScore += 20;
    if (h1Match) seoScore += 20;
    if (hasOG) seoScore += 20;
    if (hasSchema) seoScore += 20;

    // Emails from HTML
    const emailMatches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    const cleanEmails = [...new Set(emailMatches.filter(e =>
      !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg') && 
      !e.includes('example') && !e.includes('sentry') && !e.includes('wix')
    ))].slice(0, 5);

    // Phones from HTML
    const phoneMatches = html.match(/\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}/g) || [];

    // Frameworks
    const frameworks: string[] = [];
    if (html.includes('_next/static') || html.includes('__reactFiber')) frameworks.push('React/Next.js');
    if (html.includes('__vue__')) frameworks.push('Vue.js');
    if (htmlLower.includes('jquery')) frameworks.push('jQuery');
    if (htmlLower.includes('bootstrap')) frameworks.push('Bootstrap');

    // Score
    let siteScore = 0;
    if (true) siteScore += 20; // exists
    if (url.startsWith('https')) siteScore += 15; // SSL
    if (loadTime < 3000) siteScore += 15;
    else if (loadTime < 5000) siteScore += 8;
    if (seoScore > 40) siteScore += 15;
    if (analytics.length > 0) siteScore += 10;
    if (pixels.length > 0) siteScore += 10;
    if (Object.values(social).some(v => v)) siteScore += 10;
    siteScore = Math.min(siteScore, 100);

    // Opportunities
    const opportunities: string[] = [];
    if (cms === 'Wix' || cms === 'GoDaddy' || cms === 'Squarespace') opportunities.push(`Using ${cms} — needs upgrade`);
    if (loadTime > 4000) opportunities.push(`Slow site (${loadTime}ms)`);
    if (pixels.length === 0) opportunities.push('No tracking pixels — can\'t run retargeting');
    if (analytics.length === 0) opportunities.push('No analytics — flying blind');
    if (seoScore < 40) opportunities.push(`Poor SEO (${seoScore}/100)`);
    if (!social.instagram) opportunities.push('No Instagram presence');
    if (!social.facebook) opportunities.push('No Facebook page');

    return {
      exists: true, ssl: url.startsWith('https'), loadTime, cms, frameworks,
      analytics, pixels, social, seo: { title: titleText, description: descText, seo_score: seoScore },
      emails: cleanEmails, phones: [...new Set(phoneMatches)].slice(0, 3),
      score: siteScore, opportunities,
    };
  } catch (e) {
    return { exists: false, score: 0, cms: null, seo: { seo_score: 0 }, social: {}, analytics: [], pixels: [], opportunities: ['Website unreachable'] };
  }
}

// ========== MAIN SCRAPE ROUTE ==========

export async function POST(req: Request) {
  try {
    const { niche, location, prompt } = await req.json();

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'Apify API token is not configured.' }, { status: 500 });
    }

    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    const searchQuery = prompt || `${niche} in ${location}`;
    console.log(`[Scrape] Starting: "${searchQuery}"`);

    // Apify call — basic business data + contacts (fast, no deep website crawl)
    const run = await client.actor('compass/crawler-google-places').call({
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: 20,
      language: 'en',
      scrapeContacts: true,
      scrapeWebsite: false,
      extractEmailsAndContacts: true,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Scrape] Got ${items.length} businesses. Now analyzing websites...`);

    // FAST parallel website analysis
    const leads = await Promise.all(items.map(async (item: any) => {
      const website = item.website || item.url || 'N/A';
      const phone = item.phone || item.phoneUnformatted || 'N/A';
      const rating = item.totalScore || item.rating || 0;
      const reviews = item.reviewsCount || 0;

      // Social data from Apify (RELIABLE — straight from Google Maps listing)
      const hasFacebook = !!(item.facebookUrl || item.facebookPage);
      const hasInstagram = !!(item.instagramUrl || item.instagramProfile);
      const facebookUrl = item.facebookUrl || item.facebookPage || null;
      const instagramUrl = item.instagramUrl || item.instagramProfile || null;

      // Run our own fast website analysis
      const siteData = await analyzeWebsite(website);

      // Merge social: Apify data + HTML detection
      const socialFb = hasFacebook || !!siteData.social?.facebook;
      const socialInsta = hasInstagram || !!siteData.social?.instagram;

      // Extract emails — from Apify first, then site analysis
      const apifyEmails = item.emails || [];
      const siteEmails = siteData.emails || [];
      const allEmails = [...new Set([...apifyEmails, ...siteEmails])];
      const genericPrefixes = ['info', 'contact', 'sales', 'support', 'admin', 'hello', 'office', 'team', 'service', 'mail', 'help'];
      
      let decisionMaker = 'N/A';
      let directEmail = 'N/A';
      for (const email of allEmails) {
        const prefix = email.split('@')[0].toLowerCase();
        if (!genericPrefixes.includes(prefix)) {
          directEmail = email;
          decisionMaker = prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          break;
        }
      }
      if (directEmail === 'N/A' && allEmails.length > 0) directEmail = allEmails[0];

      // Opportunity detection
      const opps: string[] = [];
      if (!website || website === 'N/A') opps.push('web');
      if (siteData.seo?.seo_score < 40 && siteData.exists) opps.push('seo');
      if (!socialInsta || !socialFb) opps.push('social');
      if (reviews < 30) opps.push('ads');
      if (allEmails.length === 0) opps.push('email');

      // Lead scoring (enhanced with site data)
      let score = 0;
      if (!website || website === 'N/A') score += 30;
      else if (siteData.cms === 'Wix' || siteData.cms === 'GoDaddy') score += 20;
      if (rating < 4.0 && rating > 0) score += 15;
      if (rating < 3.5 && rating > 0) score += 10;
      if (reviews < 10) score += 10;
      if (reviews < 30) score += 5;
      if (allEmails.length === 0) score += 10;
      if (siteData.pixels?.length === 0 && siteData.exists) score += 10;
      if (siteData.seo?.seo_score < 40 && siteData.exists) score += 10;
      if (!socialFb) score += 5;
      if (!socialInsta) score += 5;
      score = Math.min(score, 99);

      let temperature = 'Cold';
      if (score >= 70) temperature = 'Hot';
      else if (score >= 40) temperature = 'Warm';

      return {
        companyName: item.title || item.name || 'Unknown',
        category: item.categoryName || item.categories?.[0] || 'N/A',
        address: item.address || item.street || 'N/A',
        city: item.city || location || 'N/A',
        phone: phone !== 'N/A' ? phone : (siteData.phones?.[0] || 'N/A'),
        website,
        email: directEmail !== 'N/A' ? directEmail : (allEmails[0] || 'N/A'),
        rating,
        reviews,
        score,
        temperature,
        opps,
        decisionMaker,
        directEmail,
        facebookUrl,
        instagramUrl,
        social: {
          fb: socialFb,
          insta: socialInsta,
          google: true,
        },
        // FULL SITE INTELLIGENCE
        siteAnalysis: {
          exists: siteData.exists,
          cms: siteData.cms,
          loadTime: siteData.loadTime,
          seoScore: siteData.seo?.seo_score || 0,
          seoTitle: siteData.seo?.title,
          analytics: siteData.analytics || [],
          pixels: siteData.pixels || [],
          frameworks: siteData.frameworks || [],
          siteScore: siteData.score || 0,
          opportunities: siteData.opportunities || [],
          ssl: siteData.ssl,
        },
      };
    }));

    // Sort by score descending
    leads.sort((a, b) => b.score - a.score);

    const hotCount = leads.filter(l => l.temperature === 'Hot').length;
    const avgRating = leads.length ? (leads.reduce((s, l) => s + (l.rating || 0), 0) / leads.length).toFixed(1) : '0';
    const insights = `Found ${leads.length} businesses for "${searchQuery}". ${hotCount} identified as Hot leads. Average rating: ${avgRating}.`;

    console.log(`[Scrape] Done! ${leads.length} leads, ${hotCount} hot`);
    return NextResponse.json({ leads, insights });
  } catch (error: any) {
    console.error('Error in scrape API:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape data.' }, { status: 500 });
  }
}
