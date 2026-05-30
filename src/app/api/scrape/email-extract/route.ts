// =============================================================================
// PitchRadar — Deep Email Extraction
// POST /api/scrape/email-extract
// Accepts { url: string }
// Deep-crawls a single domain, validates emails via MX, classifies them
// =============================================================================

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailExtractRequest {
  url: string;
}

interface ExtractedEmail {
  email: string;
  valid: boolean;
  type: 'personal' | 'generic';
  confidence: number;
  source_page: string;
}

interface EmailExtractResponse {
  emails: ExtractedEmail[];
  domain: string;
  pages_crawled: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JUNK_EMAIL_PATTERNS = /\.(png|jpg|jpeg|gif|svg|css|js|ico|webp)$/i;
const JUNK_DOMAINS = [
  'example.com', 'sentry.io', 'wixpress.com', 'squarespace.com',
  'wordpress.com', 'gravatar.com', 'schema.org', 'w3.org',
  'googleapis.com', 'cloudflare.com',
];

const GENERIC_PREFIXES = new Set([
  'info', 'contact', 'sales', 'support', 'admin', 'hello', 'office',
  'team', 'service', 'mail', 'help', 'enquiry', 'inquiry', 'webmaster',
  'noreply', 'no-reply', 'billing', 'accounts', 'hr', 'careers',
  'jobs', 'press', 'media', 'marketing', 'feedback', 'general',
]);

// Subpaths that are most likely to contain email addresses
const PRIORITY_PATHS = ['/contact', '/about', '/team', '/about-us', '/contact-us'];
const LINK_PATTERNS = [
  /href=["']([^"']*(?:contact|about|team|staff|people|leadership|our-team|meet)[^"']*)["']/gi,
];

// ─── Helper: fetch page HTML ─────────────────────────────────────────────────

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

// ─── Helper: extract emails from HTML string ─────────────────────────────────

function extractEmailsFromHtml(html: string): string[] {
  const raw = html.match(EMAIL_REGEX) || [];
  return [...new Set(raw)].filter(email => {
    if (JUNK_EMAIL_PATTERNS.test(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    return !JUNK_DOMAINS.some(j => domain.includes(j));
  });
}

// ─── Helper: find internal links from HTML ───────────────────────────────────

function findInternalLinks(html: string, origin: string): string[] {
  const links = new Set<string>();

  // Extract href attributes
  const hrefMatches = html.matchAll(/href=["']([^"'#]+)["']/gi);
  for (const m of hrefMatches) {
    const href = m[1];
    if (!href) continue;

    try {
      // Handle both absolute and relative URLs
      const resolved = new URL(href, origin);
      // Only keep same-origin links
      if (resolved.origin === origin) {
        const path = resolved.pathname.toLowerCase();
        // Prioritize pages likely to have emails
        if (/contact|about|team|staff|people|leadership|meet|our-team/.test(path)) {
          links.add(resolved.href);
        }
      }
    } catch {
      // Skip malformed URLs
    }
  }

  // Also try the standard priority paths
  for (const path of PRIORITY_PATHS) {
    links.add(`${origin}${path}`);
  }

  return [...links].slice(0, 5); // Cap at 5 internal pages
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

// ─── Helper: classify email and compute confidence ───────────────────────────

function classifyEmail(email: string, hasMX: boolean): { type: 'personal' | 'generic'; confidence: number } {
  const prefix = email.split('@')[0].toLowerCase();
  const isGeneric = GENERIC_PREFIXES.has(prefix);

  let confidence: number;
  if (hasMX && !isGeneric) {
    confidence = 95; // MX valid + personal = highest confidence
  } else if (hasMX && isGeneric) {
    confidence = 80; // MX valid + generic = good but impersonal
  } else if (!hasMX && !isGeneric) {
    confidence = 40; // No MX + personal = risky
  } else {
    confidence = 30; // No MX + generic = lowest confidence
  }

  return { type: isGeneric ? 'generic' : 'personal', confidence };
}

// ─── Helper: normalize URL ───────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  // Remove trailing slash for consistency
  return normalized.replace(/\/+$/, '');
}

// ========== MAIN POST HANDLER ==========

export async function POST(req: Request) {
  // Parse request
  let body: EmailExtractRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { url: rawUrl } = body;

  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'url is required and must be a non-empty string' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = normalizeUrl(rawUrl);
  let origin: string;
  let domain: string;
  try {
    const parsed = new URL(url);
    origin = parsed.origin;
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    return new Response(
      JSON.stringify({ error: `Invalid URL: ${rawUrl}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Track emails by source page
    const emailsByPage = new Map<string, string[]>();
    const pagesCrawled: string[] = [];

    // 1. Fetch homepage
    const homepageHtml = await fetchPage(url, 5000);
    if (!homepageHtml) {
      return new Response(
        JSON.stringify({
          emails: [],
          domain,
          pages_crawled: 0,
          error: 'Could not fetch the homepage. The site may be down or blocking requests.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    pagesCrawled.push(url);
    const homepageEmails = extractEmailsFromHtml(homepageHtml);
    emailsByPage.set(url, homepageEmails);

    // 2. Find and fetch internal pages
    const internalLinks = findInternalLinks(homepageHtml, origin);

    const internalFetches = internalLinks.map(async (pageUrl) => {
      try {
        const html = await fetchPage(pageUrl, 4000);
        if (html && html.length > 200) { // Minimal content check
          pagesCrawled.push(pageUrl);
          const emails = extractEmailsFromHtml(html);
          emailsByPage.set(pageUrl, emails);
        }
      } catch {
        // Skip failed pages
      }
    });

    await Promise.allSettled(internalFetches);

    // 3. Collect all unique emails with their source pages
    const emailSourceMap = new Map<string, string>(); // email → first source page
    for (const [page, emails] of emailsByPage) {
      for (const email of emails) {
        // Only track emails from the target domain or clearly related
        if (!emailSourceMap.has(email)) {
          emailSourceMap.set(email, page);
        }
      }
    }

    // 4. Validate and classify each email
    const emailEntries = [...emailSourceMap.entries()];
    const validationPromises = emailEntries.map(async ([email, sourcePage]): Promise<ExtractedEmail> => {
      const hasMX = await validateEmailMX(email);
      const { type, confidence } = classifyEmail(email, hasMX);
      return {
        email,
        valid: hasMX,
        type,
        confidence,
        source_page: sourcePage,
      };
    });

    const results = await Promise.allSettled(validationPromises);
    const emails: ExtractedEmail[] = results
      .filter((r): r is PromiseFulfilledResult<ExtractedEmail> => r.status === 'fulfilled')
      .map(r => r.value)
      // Sort: valid personal first, then valid generic, then invalid
      .sort((a, b) => {
        if (a.valid !== b.valid) return a.valid ? -1 : 1;
        if (a.type !== b.type) return a.type === 'personal' ? -1 : 1;
        return b.confidence - a.confidence;
      });

    const response: EmailExtractResponse = {
      emails,
      domain,
      pages_crawled: pagesCrawled.length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Email extraction error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
