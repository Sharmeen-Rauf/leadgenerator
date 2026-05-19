import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// ========== DEEP WEBSITE INTELLIGENCE ANALYZER ==========

async function analyzeWebsite(url: string): Promise<any> {
  const empty = { exists: false, score: 0, cms: null, seo: {}, social: {}, analytics: [], pixels: [], conversion: {}, tech: {}, aeo: {}, opportunities: [], categories: {} };
  if (!url || url === 'N/A') return { ...empty, opportunities: ['No website — critical gap'] };
  if (!url.startsWith('http')) url = `https://${url}`;

  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(8000), redirect: 'follow',
    });
    const loadTime = Date.now() - start;
    const html = await res.text();
    const h = html.toLowerCase();

    // --- CMS ---
    const cmsList: [string, string[]][] = [
      ['WordPress', ['wp-content', 'wp-includes']], ['Shopify', ['shopify.com', 'cdn.shopify']],
      ['Wix', ['wix.com', 'wixsite.com', '_wixCIDX']], ['Squarespace', ['squarespace.com', 'static.squarespace']],
      ['Webflow', ['webflow.com', 'webflow.io']], ['Joomla', ['joomla', '/components/com_']],
      ['Drupal', ['Drupal.settings']], ['GoDaddy', ['godaddy.com', 'godaddysites.com']],
      ['WooCommerce', ['woocommerce', 'wc-api']],
    ];
    let cms = 'Custom/Unknown';
    for (const [name, sigs] of cmsList) { if (sigs.some(s => h.includes(s.toLowerCase()))) { cms = name; break; } }

    // --- ANALYTICS ---
    const analytics: string[] = [];
    if (h.includes('gtag(') || h.includes('google-analytics.com')) analytics.push('Google Analytics');
    if (h.includes('googletagmanager.com')) analytics.push('GTM');
    if (h.includes('hotjar.com')) analytics.push('Hotjar');
    if (h.includes('clarity.ms')) analytics.push('Clarity');
    if (h.includes('mixpanel')) analytics.push('Mixpanel');
    if (h.includes('segment.com') || h.includes('analytics.js')) analytics.push('Segment');

    // --- PIXELS ---
    const pixels: string[] = [];
    if (h.includes('fbq(') || h.includes('fbevents')) pixels.push('Facebook Pixel');
    if (h.includes('snap.licdn.com') || h.includes('linkedin.com/px')) pixels.push('LinkedIn');
    if (h.includes('tiktok.com/i18n/pixel') || h.includes('ttq.track')) pixels.push('TikTok');
    if (h.includes('googleadservices.com') || /AW-\d/.test(html)) pixels.push('Google Ads');
    if (h.includes('ads.twitter.com') || h.includes('twq(')) pixels.push('Twitter/X');

    // --- SOCIAL LINKS ---
    const social: Record<string, boolean> = {};
    social.facebook = /facebook\.com\/(?!sharer|share|plugins)[\w.-]+/i.test(html);
    social.instagram = /instagram\.com\/[\w.-]+/i.test(html);
    social.twitter = /(?:twitter|x)\.com\/[\w.-]+/i.test(html);
    social.linkedin = /linkedin\.com\/(?:company|in)\/[\w.-]+/i.test(html);
    social.youtube = /youtube\.com\/(?:channel|c|user|@)[\w.-]+/i.test(html);
    social.tiktok = /tiktok\.com\/@[\w.-]+/i.test(html);

    // --- SEO DEEP ---
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleText = titleM ? titleM[1].trim() : null;
    const descM = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const descText = descM ? descM[1].trim() : null;
    const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    const h2s = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || [];
    const hasOG = /property=["']og:/i.test(html);
    const hasSchema = html.includes('application/ld+json');
    const hasFaqSchema = h.includes('"faqpage"') || h.includes('faqpage');
    const hasLocalSchema = h.includes('"localbusiness"') || h.includes('localbusiness');
    const imgTotal = (html.match(/<img /gi) || []).length;
    const imgNoAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    const hasSitemap = h.includes('sitemap.xml');
    const hasRobots = h.includes('robots.txt');
    const hasBlog = /\/(blog|news|articles|insights|resources)\b/i.test(html);
    const wordCount = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    const hasCanonical = /rel=["']canonical["']/i.test(html);

    let seoScore = 0;
    if (titleText && titleText.length > 20 && titleText.length < 65) seoScore += 15;
    if (descText && descText.length > 80 && descText.length < 165) seoScore += 15;
    if (h1s.length === 1) seoScore += 10; else if (h1s.length > 1) seoScore += 5;
    if (h2s.length >= 2) seoScore += 10;
    if (hasOG) seoScore += 10;
    if (hasSchema) seoScore += 10;
    if (hasFaqSchema) seoScore += 5;
    if (hasCanonical) seoScore += 5;
    if (hasBlog) seoScore += 10;
    if (imgNoAlt < imgTotal * 0.3) seoScore += 10;

    // --- CONVERSION INTELLIGENCE ---
    const hasForm = /<form/i.test(html);
    const hasLeadForm = /contact|quote|inquiry|estimate|book|schedule|consult/i.test(html) && hasForm;
    const ctaCount = (html.match(/class=["'][^"']*(?:btn|button|cta)[^"']*/gi) || []).length;
    const hasCalendly = h.includes('calendly.com');
    const hasAcuity = h.includes('acuityscheduling');
    const hasBooking = hasCalendly || hasAcuity || h.includes('booking') || h.includes('schedule');
    const hasChat = h.includes('tawk.to') || h.includes('drift.com') || h.includes('intercom') || h.includes('crisp.chat') || h.includes('livechat') || h.includes('tidio');
    const hasWhatsapp = h.includes('whatsapp') || h.includes('wa.me');
    const hasTestimonials = /testimonial|review|what .* say|client .* say|customer .* say/i.test(html);
    const hasTrustBadges = /trust|certified|accredited|bbb|licensed|insured|guarantee/i.test(html);
    const hasPortfolio = /portfolio|gallery|our work|projects|case stud/i.test(html);
    const hasPricing = /pricing|price|cost|rates|packages|plans/i.test(html);
    const hasPopup = h.includes('popup') || h.includes('modal') || h.includes('exit-intent');
    const hasVideo = /<video|youtube\.com|vimeo\.com|wistia/i.test(html);

    // --- TECHNICAL ---
    const hasCDN = /cloudflare|cloudfront|fastly|akamai|cdn\./i.test(html);
    const hasLazyLoad = /loading=["']lazy["']|lazyload/i.test(html);
    const ssl = url.startsWith('https');
    const frameworks: string[] = [];
    if (h.includes('_next/static') || h.includes('__reactfiber')) frameworks.push('React/Next.js');
    if (h.includes('__vue__') || h.includes('nuxt')) frameworks.push('Vue.js');
    if (h.includes('ng-version')) frameworks.push('Angular');
    if (h.includes('jquery')) frameworks.push('jQuery');
    if (h.includes('bootstrap')) frameworks.push('Bootstrap');
    if (h.includes('tailwind')) frameworks.push('Tailwind');

    // --- AEO READINESS ---
    const aeoScore = [
      hasFaqSchema ? 20 : 0,
      h2s.length >= 3 ? 15 : h2s.length >= 1 ? 8 : 0,
      hasSchema ? 15 : 0,
      /<table/i.test(html) ? 10 : 0,
      /<ul|<ol/i.test(html) ? 10 : 0,
      wordCount > 1000 ? 15 : wordCount > 500 ? 8 : 0,
      hasBlog ? 15 : 0,
    ].reduce((a, b) => a + b, 0);

    // --- EMAILS & PHONES ---
    const emails = [...new Set((html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
      .filter(e => !e.match(/\.(png|jpg|svg|css|js)/) && !e.includes('example') && !e.includes('sentry')))].slice(0, 5);
    const phones = [...new Set((html.match(/\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}/g) || []))].slice(0, 3);

    // --- SITE SCORE ---
    let siteScore = 0;
    siteScore += 10; // exists
    if (ssl) siteScore += 8;
    if (loadTime < 2000) siteScore += 12; else if (loadTime < 3500) siteScore += 8; else if (loadTime < 5000) siteScore += 4;
    if (seoScore > 60) siteScore += 12; else if (seoScore > 40) siteScore += 8; else if (seoScore > 20) siteScore += 4;
    if (analytics.length > 0) siteScore += 8;
    if (pixels.length > 0) siteScore += 8;
    if (Object.values(social).filter(v => v).length >= 2) siteScore += 8;
    if (hasForm) siteScore += 6;
    if (hasChat || hasWhatsapp) siteScore += 5;
    if (hasBooking) siteScore += 5;
    if (hasTestimonials) siteScore += 4;
    if (hasTrustBadges) siteScore += 4;
    if (cms !== 'Wix' && cms !== 'GoDaddy') siteScore += 5;
    if (hasVideo) siteScore += 3;
    if (hasCDN) siteScore += 2;
    siteScore = Math.min(siteScore, 100);

    // --- OPPORTUNITIES ---
    const opps: string[] = [];
    if (cms === 'Wix' || cms === 'GoDaddy' || cms === 'Squarespace') opps.push(`${cms} platform — needs professional upgrade`);
    if (loadTime > 4000) opps.push(`Slow site (${(loadTime/1000).toFixed(1)}s) — losing mobile visitors`);
    if (pixels.length === 0) opps.push('No ad pixels — cannot retarget visitors');
    if (analytics.length === 0) opps.push('No analytics — flying blind on traffic');
    if (seoScore < 40) opps.push(`Weak SEO (${seoScore}/100) — invisible in search`);
    if (!hasForm && !hasLeadForm) opps.push('No lead capture form — leaking conversions');
    if (!hasChat && !hasWhatsapp) opps.push('No live chat/WhatsApp — losing impatient leads');
    if (!hasBooking) opps.push('No online booking — friction in customer journey');
    if (!hasTestimonials) opps.push('No testimonials — missing social proof');
    if (!hasTrustBadges) opps.push('No trust badges — low credibility');
    if (!social.instagram) opps.push('No Instagram presence');
    if (!social.facebook) opps.push('No Facebook page linked');
    if (!hasBlog) opps.push('No blog — missing organic traffic engine');
    if (aeoScore < 30) opps.push('Not optimized for AI search (ChatGPT/Gemini)');
    if (!hasVideo) opps.push('No video content — lower engagement');
    if (!ssl) opps.push('No SSL — security warning shown to visitors');

    return {
      exists: true, ssl, loadTime, cms, frameworks, analytics, pixels, social,
      emails, phones, score: siteScore, opportunities: opps,
      seo: { title: titleText, description: descText, h1Count: h1s.length, h2Count: h2s.length, hasOG, hasSchema, hasFaqSchema, hasLocalSchema, hasBlog, hasSitemap, hasCanonical, imgTotal, imgNoAlt, wordCount, seo_score: seoScore },
      conversion: { hasForm, hasLeadForm, ctaCount, hasBooking, hasCalendly, hasChat, hasWhatsapp, hasTestimonials, hasTrustBadges, hasPortfolio, hasPricing, hasPopup, hasVideo },
      tech: { hasCDN, hasLazyLoad },
      aeo: { score: aeoScore, hasFaqSchema, hasStructuredData: hasSchema, contentDepth: wordCount > 1000 ? 'deep' : wordCount > 500 ? 'moderate' : 'thin' },
      categories: {
        website: Math.min(Math.round(siteScore), 100),
        seo: Math.min(seoScore, 100),
        conversion: Math.min(Math.round((hasForm?15:0)+(hasBooking?15:0)+(hasChat?15:0)+(hasTestimonials?10:0)+(hasTrustBadges?10:0)+(hasPortfolio?10:0)+(ctaCount>2?10:ctaCount>0?5:0)+(hasVideo?10:0)+(hasPricing?5:0)), 100),
        social: Math.min(Math.round(Object.values(social).filter(v=>v).length * 17), 100),
        ads: Math.min(Math.round((analytics.length>0?30:0)+(pixels.length>0?40:0)+(hasForm?15:0)+(ctaCount>0?15:0)), 100),
        aeo: Math.min(aeoScore, 100),
      },
    };
  } catch {
    return { ...empty, opportunities: ['Website unreachable — may be down'] };
  }
}

// ========== WEIGHTED SCORING ENGINE ==========

function calculateWeightedScore(biz: any, site: any, niche: string): any {
  const cats = site.categories || {};
  const rating = biz.rating || 0;
  const reviews = biz.reviews || 0;

  // Invert scores: high site score = low opportunity, low site score = high opportunity
  const websiteGap = 100 - (cats.website || 0);
  const seoGap = 100 - (cats.seo || 0);
  const convGap = 100 - (cats.conversion || 0);
  const socialGap = 100 - (cats.social || 0);
  const adsGap = 100 - (cats.ads || 0);
  const aeoGap = 100 - (cats.aeo || 0);

  // Local SEO (from reviews/rating)
  let localSeoGap = 0;
  if (rating < 3.5 && rating > 0) localSeoGap = 90;
  else if (rating < 4.0 && rating > 0) localSeoGap = 60;
  else if (rating < 4.5) localSeoGap = 30;
  if (reviews < 10) localSeoGap = Math.max(localSeoGap, 70);
  else if (reviews < 30) localSeoGap = Math.max(localSeoGap, 40);

  // Buying intent
  let intent = 0;
  if (!site.exists) intent = 90;
  else if (site.cms === 'Wix' || site.cms === 'GoDaddy') intent += 30;
  if (site.loadTime > 5000) intent += 20;
  if (rating > 0 && rating < 3.5) intent += 25;
  if (reviews > 50 && rating >= 4.0 && websiteGap > 50) intent += 25; // Good biz, bad site
  intent = Math.min(intent, 100);

  // WEIGHTED FORMULA: Score = Σ(weight × gap) / 100
  const weights = { website: 20, seo: 20, localSeo: 15, ads: 10, social: 10, conversion: 10, intent: 10, aeo: 5 };
  const raw = (
    weights.website * websiteGap +
    weights.seo * seoGap +
    weights.localSeo * localSeoGap +
    weights.ads * adsGap +
    weights.social * socialGap +
    weights.conversion * convGap +
    weights.intent * intent +
    weights.aeo * aeoGap
  ) / 100;
  const score = Math.min(Math.round(raw), 99);

  // Revenue estimation
  const revenueMultiplier: Record<string, number> = {
    'roofing': 8000, 'dental': 5000, 'dentist': 5000, 'lawyer': 12000, 'restaurant': 3000,
    'plumbing': 4000, 'hvac': 6000, 'real estate': 7000, 'gym': 3000, default: 4000,
  };
  const nicheLower = niche.toLowerCase();
  const avgJobValue = Object.entries(revenueMultiplier).find(([k]) => nicheLower.includes(k))?.[1] || revenueMultiplier.default;
  const lostLeadsPerMonth = Math.round((websiteGap / 100) * 15 + (seoGap / 100) * 10 + (convGap / 100) * 8);
  const estimatedMonthlyLoss = lostLeadsPerMonth * avgJobValue * 0.1;

  return {
    score, intent,
    breakdown: {
      website: { score: websiteGap, weight: weights.website, label: 'Website Issues' },
      seo: { score: seoGap, weight: weights.seo, label: 'SEO Weakness' },
      localSeo: { score: localSeoGap, weight: weights.localSeo, label: 'Local SEO' },
      ads: { score: adsGap, weight: weights.ads, label: 'Ads Opportunity' },
      social: { score: socialGap, weight: weights.social, label: 'Social Gaps' },
      conversion: { score: convGap, weight: weights.conversion, label: 'Conversion Issues' },
      buyingIntent: { score: intent, weight: weights.intent, label: 'Buying Intent' },
      aeo: { score: aeoGap, weight: weights.aeo, label: 'AI Search Readiness' },
    },
    revenue: {
      lostLeadsPerMonth,
      estimatedMonthlyLoss: Math.round(estimatedMonthlyLoss),
      avgJobValue,
      topService: websiteGap > seoGap ? 'Web Redesign' : 'SEO',
      estimatedDealValue: `$${Math.round(estimatedMonthlyLoss * 3).toLocaleString()} - $${Math.round(estimatedMonthlyLoss * 6).toLocaleString()}/yr`,
    },
    classification: score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD',
    color: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
  };
}

// ========== MAIN ==========

export async function POST(req: Request) {
  try {
    const { niche, location, prompt } = await req.json();
    if (!process.env.APIFY_API_TOKEN) return NextResponse.json({ error: 'Apify token missing.' }, { status: 500 });

    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    const searchQuery = prompt || `${niche} in ${location}`;

    const run = await client.actor('compass/crawler-google-places').call({
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: 20,
      language: 'en',
      scrapeContacts: true,
      scrapeWebsite: false,
      extractEmailsAndContacts: true,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const leads = await Promise.all(items.map(async (item: any) => {
      const website = item.website || item.url || 'N/A';
      const phone = item.phone || item.phoneUnformatted || 'N/A';
      const rating = item.totalScore || item.rating || 0;
      const reviews = item.reviewsCount || 0;

      const hasFacebook = !!(item.facebookUrl || item.facebookPage);
      const hasInstagram = !!(item.instagramUrl || item.instagramProfile);

      const siteData = await analyzeWebsite(website);
      const socialFb = hasFacebook || !!siteData.social?.facebook;
      const socialInsta = hasInstagram || !!siteData.social?.instagram;

      const apifyEmails = item.emails || [];
      const siteEmails = siteData.emails || [];
      const allEmails = [...new Set([...apifyEmails, ...siteEmails])];
      const generic = ['info', 'contact', 'sales', 'support', 'admin', 'hello', 'office', 'team', 'service', 'mail', 'help'];

      let decisionMaker = 'N/A', directEmail = 'N/A';
      for (const email of allEmails) {
        const p = email.split('@')[0].toLowerCase();
        if (!generic.includes(p)) { directEmail = email; decisionMaker = p.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); break; }
      }
      if (directEmail === 'N/A' && allEmails.length > 0) directEmail = allEmails[0];

      const scoring = calculateWeightedScore({ rating, reviews }, siteData, niche || '');

      const opps: string[] = [];
      if (!website || website === 'N/A') opps.push('web');
      if (siteData.seo?.seo_score < 40 && siteData.exists) opps.push('seo');
      if (!socialInsta || !socialFb) opps.push('social');
      if (reviews < 30) opps.push('ads');
      if (allEmails.length === 0) opps.push('email');

      return {
        companyName: item.title || item.name || 'Unknown',
        category: item.categoryName || item.categories?.[0] || 'N/A',
        address: item.address || item.street || 'N/A',
        city: item.city || location || 'N/A',
        phone: phone !== 'N/A' ? phone : (siteData.phones?.[0] || 'N/A'),
        website, email: directEmail !== 'N/A' ? directEmail : (allEmails[0] || 'N/A'),
        rating, reviews, score: scoring.score,
        temperature: scoring.classification === 'HOT' ? 'Hot' : scoring.classification === 'WARM' ? 'Warm' : 'Cold',
        opps, decisionMaker, directEmail,
        facebookUrl: item.facebookUrl || null,
        instagramUrl: item.instagramUrl || null,
        placeUrl: item.url || null,
        social: { fb: socialFb, insta: socialInsta, google: true },
        siteAnalysis: {
          exists: siteData.exists, cms: siteData.cms, loadTime: siteData.loadTime,
          seoScore: siteData.seo?.seo_score || 0, seoTitle: siteData.seo?.title,
          analytics: siteData.analytics || [], pixels: siteData.pixels || [],
          frameworks: siteData.frameworks || [], siteScore: siteData.score || 0,
          opportunities: siteData.opportunities || [], ssl: siteData.ssl,
          conversion: siteData.conversion || {}, aeo: siteData.aeo || {},
          seo: siteData.seo || {}, categories: siteData.categories || {},
        },
        scoring,
      };
    }));

    leads.sort((a, b) => b.score - a.score);
    const hotCount = leads.filter(l => l.temperature === 'Hot').length;
    const avgRating = leads.length ? (leads.reduce((s, l) => s + (l.rating || 0), 0) / leads.length).toFixed(1) : '0';
    const totalRevLoss = leads.reduce((s, l) => s + (l.scoring?.revenue?.estimatedMonthlyLoss || 0), 0);

    return NextResponse.json({
      leads,
      insights: `Found ${leads.length} businesses for "${searchQuery}". ${hotCount} Hot leads identified. Average rating: ${avgRating}. Estimated total revenue opportunity: $${totalRevLoss.toLocaleString()}/mo.`,
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape.' }, { status: 500 });
  }
}
