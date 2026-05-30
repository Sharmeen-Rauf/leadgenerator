// =============================================================================
// PitchRadar — Bulk Free Lead Scraper (SSE)
// POST /api/scrape/bulk
// Accepts { keyword, country, maxResults }
// Uses Google Custom Search JSON API → analyzes each site → streams results
// =============================================================================

// ─── Types ───────────────────────────────────────────────────────────────────

interface BulkScrapeRequest {
  keyword: string;
  country: string;
  maxResults?: number;
}

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  error?: { message: string };
}

interface SiteAnalysis {
  exists: boolean;
  ssl: boolean;
  loadTime: number;
  cms: string | null;
  frameworks: string[];
  analytics: string[];
  pixels: string[];
  social: Record<string, boolean>;
  emails: string[];
  phones: string[];
  score: number;
  opportunities: string[];
  seo: Record<string, unknown>;
  conversion: Record<string, unknown>;
  tech: Record<string, unknown>;
  aeo: Record<string, unknown>;
  categories: Record<string, number>;
}

interface ScoringResult {
  score: number;
  intent: number;
  breakdown: Record<string, { score: number; weight: number; label: string }>;
  revenue: {
    lostLeadsPerMonth: number;
    estimatedMonthlyLoss: number;
    avgJobValue: number;
    topService: string;
    estimatedDealValue: string;
  };
  classification: 'HOT' | 'WARM' | 'COLD';
  color: string;
}

// ─── Email filtering constants ───────────────────────────────────────────────

const JUNK_EMAIL_PATTERNS = /\.(png|jpg|jpeg|gif|svg|css|js|ico|webp)$/i;
const JUNK_EMAIL_DOMAINS = [
  'example.com', 'sentry.io', 'wixpress.com', 'squarespace.com',
  'wordpress.com', 'gravatar.com', 'schema.org', 'w3.org',
];
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}/g;

const GENERIC_PREFIXES = [
  'info', 'contact', 'sales', 'support', 'admin', 'hello',
  'office', 'team', 'service', 'mail', 'help', 'enquiry',
  'inquiry', 'webmaster', 'noreply', 'no-reply',
];

// ─── Helper: fetch a page with timeout ───────────────────────────────────────

async function fetchPage(url: string, timeoutMs = 5000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

// ─── Helper: extract emails from HTML ────────────────────────────────────────

function extractEmails(html: string): string[] {
  const raw = html.match(EMAIL_REGEX) || [];
  return [...new Set(raw)].filter(email => {
    if (JUNK_EMAIL_PATTERNS.test(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    return !JUNK_EMAIL_DOMAINS.some(j => domain.includes(j));
  });
}

// ─── Helper: validate email via DNS MX ───────────────────────────────────────

async function validateEmailMX(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    const dns = await import('dns');
    await dns.promises.resolve(domain, 'MX');
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: extract phones from HTML ────────────────────────────────────────

function extractPhones(html: string): string[] {
  return [...new Set(html.match(PHONE_REGEX) || [])].slice(0, 3);
}

// ========== DEEP WEBSITE INTELLIGENCE ANALYZER (copied from scrape/route.ts) =

async function analyzeWebsite(url: string): Promise<SiteAnalysis> {
  const empty: SiteAnalysis = {
    exists: false, score: 0, cms: null, ssl: false, loadTime: 0,
    frameworks: [], analytics: [], pixels: [],
    social: {}, emails: [], phones: [],
    seo: {}, conversion: {}, tech: {}, aeo: {},
    opportunities: ['No website — critical gap'], categories: {},
  };
  if (!url || url === 'N/A') return empty;
  if (!url.startsWith('http')) url = `https://${url}`;

  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(4000), redirect: 'follow',
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
    return { ...empty, exists: false, opportunities: ['Website unreachable — may be down'] };
  }
}

// ========== WEIGHTED SCORING ENGINE (copied from scrape/route.ts) ============

function calculateWeightedScore(
  biz: { rating: number; reviews: number },
  site: SiteAnalysis,
  niche: string
): ScoringResult {
  const cats = site.categories || {};
  const rating = biz.rating || 0;
  const reviews = biz.reviews || 0;

  // Invert scores: high site score = low opportunity
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
  if (reviews > 50 && rating >= 4.0 && websiteGap > 50) intent += 25;
  intent = Math.min(intent, 100);

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

// ─── Helper: crawl extra pages for emails ────────────────────────────────────

async function crawlForEmails(baseUrl: string, homepageHtml: string): Promise<string[]> {
  const allEmails = extractEmails(homepageHtml);
  const subpages = ['/contact', '/about', '/about-us', '/contact-us', '/team'];

  // Parse base URL to build subpage URLs
  let origin: string;
  try {
    const parsed = new URL(baseUrl);
    origin = parsed.origin;
  } catch {
    return allEmails;
  }

  // Fetch subpages concurrently with a short timeout
  const fetches = subpages.map(async (path) => {
    try {
      const html = await fetchPage(`${origin}${path}`, 4000);
      if (html) return extractEmails(html);
    } catch { /* skip failed pages */ }
    return [];
  });

  const results = await Promise.allSettled(fetches);
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allEmails.push(...r.value);
    }
  }

  return [...new Set(allEmails)];
}

// ─── Helper: normalize a URL for de-duplication ──────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ─── Google Custom Search ────────────────────────────────────────────────────

async function googleSearch(
  keyword: string,
  country: string,
  maxResults: number,
  apiKey: string,
  cseId: string
): Promise<GoogleSearchItem[]> {
  const results: GoogleSearchItem[] = [];
  const queries = Math.ceil(maxResults / 10);

  for (let i = 0; i < queries; i++) {
    const start = i * 10 + 1;
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cseId);
    url.searchParams.set('q', `${keyword} ${country}`);
    url.searchParams.set('start', String(start));
    // Request 10 per page (API default/max)
    url.searchParams.set('num', '10');

    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as GoogleSearchResponse;

      if (data.error) {
        console.error(`Google CSE error: ${data.error.message}`);
        break;
      }

      if (data.items) {
        results.push(...data.items);
      } else {
        // No more results available
        break;
      }
    } catch (err) {
      console.error(`Google CSE fetch failed for start=${start}:`, err);
      break;
    }

    // Stop if we have enough
    if (results.length >= maxResults) break;
  }

  return results.slice(0, maxResults);
}

// ─── DuckDuckGo Search Fallback (Free, No Keys Required) ─────────────────────

async function duckDuckGoSearch(
  keyword: string,
  country: string,
  maxResults: number
): Promise<GoogleSearchItem[]> {
  const query = `${keyword} in ${country}`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!res.ok) {
      console.error(`DuckDuckGo Search failed: HTTP ${res.status}`);
      return [];
    }
    
    const html = await res.text();
    const items: GoogleSearchItem[] = [];
    
    const hrefRegex = /href="(\/\/duckduckgo\.com\/l\/\?uddg=[^"]+)"/gi;
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const rawUrl = 'https:' + match[1].replace(/&amp;/g, '&');
        const urlObj = new URL(rawUrl);
        const target = urlObj.searchParams.get('uddg');
        if (target) {
          const lower = target.toLowerCase();
          const skip = [
            'yelp.com', 'tripadvisor.com', 'foursquare.com', 'angi.com', 
            'yellowpages.com', 'linkedin.com', 'facebook.com', 'twitter.com', 
            'instagram.com', 'youtube.com', 'wikipedia.org', 'groupon.com', 
            'mapquest.com', 'thumbtack.com'
          ];
          if (!skip.some(s => lower.includes(s))) {
            items.push({
              link: target,
              title: extractDomain(target),
              snippet: ''
            });
          }
        }
      } catch {
        // skip
      }
    }
    
    // De-duplicate items by domain
    const seen = new Set<string>();
    const uniqueItems: GoogleSearchItem[] = [];
    for (const item of items) {
      if (!item.link) continue;
      const domain = extractDomain(item.link);
      if (!seen.has(domain)) {
        seen.add(domain);
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems.slice(0, maxResults);
  } catch (err) {
    console.error('DuckDuckGo Search failed:', err);
    return [];
  }
}

// ─── Process a single search result into a lead ──────────────────────────────

async function processSearchResult(
  item: GoogleSearchItem,
  keyword: string
): Promise<Record<string, unknown> | null> {
  const website = item.link;
  if (!website) return null;

  try {
    // 1. Fetch homepage
    const homepageHtml = await fetchPage(website, 5000);
    if (!homepageHtml) return null;

    // 2. Extract title and meta description from search result (fallback from HTML)
    const titleFromHtml = homepageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const companyName = item.title || titleFromHtml || extractDomain(website);

    // 3. Crawl for emails across homepage + subpages
    const rawEmails = await crawlForEmails(website, homepageHtml);

    // 4. Validate emails via DNS MX (in parallel, max 5)
    const emailsToValidate = rawEmails.slice(0, 5);
    const validationResults = await Promise.allSettled(
      emailsToValidate.map(async (email) => ({
        email,
        valid: await validateEmailMX(email),
      }))
    );

    const validatedEmails = validationResults
      .filter((r): r is PromiseFulfilledResult<{ email: string; valid: boolean }> =>
        r.status === 'fulfilled' && r.value.valid
      )
      .map(r => r.value.email);

    // Use validated emails if available, fall back to raw
    const bestEmails = validatedEmails.length > 0 ? validatedEmails : rawEmails.slice(0, 3);

    // 5. Extract phones
    const phones = extractPhones(homepageHtml);

    // 6. Run full site analysis
    const siteData = await analyzeWebsite(website);

    // 7. Merge emails from site analysis + our deeper crawl
    const allEmails = [...new Set([...bestEmails, ...(siteData.emails || [])])];

    // 8. Identify decision maker
    let decisionMaker = 'N/A';
    let directEmail = 'N/A';
    for (const email of allEmails) {
      const prefix = email.split('@')[0].toLowerCase();
      if (!GENERIC_PREFIXES.includes(prefix)) {
        directEmail = email;
        decisionMaker = prefix
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        break;
      }
    }
    if (directEmail === 'N/A' && allEmails.length > 0) directEmail = allEmails[0];

    // 9. Run scoring engine
    const scoring = calculateWeightedScore({ rating: 0, reviews: 0 }, siteData, keyword);

    // 10. Detect opportunity gaps
    const opps: string[] = [];
    if (!siteData.exists) opps.push('web');
    const seoScoreVal = (siteData.seo as Record<string, unknown>)?.seo_score;
    if (typeof seoScoreVal === 'number' && seoScoreVal < 40 && siteData.exists) opps.push('seo');
    if (!siteData.social?.instagram || !siteData.social?.facebook) opps.push('social');
    if (allEmails.length === 0) opps.push('email');

    // 11. Detect address/city from snippet
    const city = item.snippet?.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,?\s*[A-Z]{2}/)?.[0] || 'N/A';

    return {
      companyName: companyName.replace(/ - .*$/, '').trim(),
      category: keyword,
      address: 'N/A',
      city,
      phone: phones[0] || siteData.phones?.[0] || 'N/A',
      website,
      email: directEmail !== 'N/A' ? directEmail : (allEmails[0] || 'N/A'),
      rating: 0,
      reviews: 0,
      score: scoring.score,
      temperature: scoring.classification === 'HOT' ? 'Hot' : scoring.classification === 'WARM' ? 'Warm' : 'Cold',
      opps,
      decisionMaker,
      directEmail,
      siteAnalysis: {
        exists: siteData.exists, cms: siteData.cms, loadTime: siteData.loadTime,
        seoScore: seoScoreVal || 0, seoTitle: (siteData.seo as Record<string, unknown>)?.title,
        analytics: siteData.analytics || [], pixels: siteData.pixels || [],
        frameworks: siteData.frameworks || [], siteScore: siteData.score || 0,
        opportunities: siteData.opportunities || [], ssl: siteData.ssl,
        conversion: siteData.conversion || {}, aeo: siteData.aeo || {},
        seo: siteData.seo || {}, categories: siteData.categories || {},
      },
      scoring,
    };
  } catch (err) {
    console.error(`Failed to process ${website}:`, err);
    return null;
  }
}

// ========== MAIN POST HANDLER — SSE STREAMING ==========

export async function POST(req: Request) {
  // Optional environment variables. If missing or failing, we fall back to DuckDuckGo search.
  const GOOGLE_CSE_KEY = process.env.GOOGLE_CSE_KEY || '';
  const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '';

  // Parse & validate request body
  let body: BulkScrapeRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { keyword, country, maxResults: rawMax } = body;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'keyword is required and must be a non-empty string' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'country is required and must be a non-empty string' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Clamp maxResults between 1 and 100 (Google CSE free tier = 100 queries/day, 10 results/query)
  const maxResults = Math.max(1, Math.min(Number(rawMax) || 10, 100));

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let searchItems: GoogleSearchItem[] = [];

        // 1. Try Google Custom Search first if keys are configured
        if (GOOGLE_CSE_KEY && GOOGLE_CSE_ID) {
          try {
            searchItems = await googleSearch(keyword.trim(), country.trim(), maxResults, GOOGLE_CSE_KEY, GOOGLE_CSE_ID);
          } catch (err) {
            console.error('Google Search API failed:', err);
          }
        }

        // 2. Fallback to DuckDuckGo search if Google fails, returns 0, or keys are missing
        if (searchItems.length === 0) {
          console.log('Falling back to DuckDuckGo search...');
          searchItems = await duckDuckGoSearch(keyword.trim(), country.trim(), maxResults);
        }

        if (searchItems.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No search results found. Try broader keywords.' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // De-duplicate by domain
        const seenDomains = new Set<string>();
        const uniqueItems: GoogleSearchItem[] = [];
        for (const item of searchItems) {
          if (!item.link) continue;
          const domain = extractDomain(item.link);
          if (seenDomains.has(domain)) continue;
          seenDomains.add(domain);
          uniqueItems.push(item);
        }

        // Send initial progress event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          message: `Found ${uniqueItems.length} unique sites. Starting analysis...`,
          total: uniqueItems.length,
          processed: 0,
        })}\n\n`));

        // 2. Process each site and stream results
        let processedCount = 0;
        for (const item of uniqueItems) {
          try {
            const lead = await processSearchResult(item, keyword.trim());
            processedCount++;

            if (lead) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(lead)}\n\n`));
            }

            // Send progress update every 3 results
            if (processedCount % 3 === 0 || processedCount === uniqueItems.length) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                message: `Analyzed ${processedCount}/${uniqueItems.length} sites...`,
                total: uniqueItems.length,
                processed: processedCount,
              })}\n\n`));
            }
          } catch (err) {
            console.error(`Error processing ${item.link}:`, err);
            // Continue processing remaining items
          }
        }

        // 3. Signal completion
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('Bulk scrape stream error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Internal stream error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx/Vercel
    },
  });
}
