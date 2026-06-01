import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

interface PeopleScrapeRequest {
  domain: string;
  companyName?: string;
  roles?: string[];
  maxResults?: number;
}

interface GoogleSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
}

// ─── Email Prediction Patterns ───────────────────────────────────────────────

function predictEmails(fullName: string, domain: string): { email: string; formats: Record<string, string> } {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  
  // Clean name (remove middle names, suffixes, degrees, etc.)
  const nameParts = fullName
    .replace(/\s+(Jr\.|Sr\.|III|PhD|MD|MBA|MSN|DDS|JD)\b/gi, '')
    .trim()
    .split(/\s+/);
    
  const first = nameParts[0]?.toLowerCase() || '';
  const last = nameParts[nameParts.length - 1]?.toLowerCase() || '';
  
  const formats = {
    first_dot_last: `${first}.${last}@${cleanDomain}`,
    first_only: `${first}@${cleanDomain}`,
    first_initial_last: `${first.charAt(0)}${last}@${cleanDomain}`,
    first_last: `${first}${last}@${cleanDomain}`,
    first_last_initial: `${first}${last.charAt(0)}@${cleanDomain}`
  };

  // Default to first.last as it's the most common corporate email structure
  return {
    email: formats.first_dot_last,
    formats
  };
}

// ─── DNS MX Resolver ─────────────────────────────────────────────────────────

async function verifyDomainMX(domain: string): Promise<boolean> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    const dns = await import('dns');
    const records = await dns.promises.resolve(cleanDomain, 'MX');
    return records && records.length > 0;
  } catch {
    return false;
  }
}

// ─── Title Parser ────────────────────────────────────────────────────────────

function parseLinkedInTitle(title: string, companyName: string) {
  // Clean up title: e.g. "John Doe - Founder & CEO - Stripe | LinkedIn" -> "John Doe", "Founder & CEO"
  const cleanTitle = title.replace(/\s*[|:-]\s*LinkedIn$/i, '').trim();
  const parts = cleanTitle.split(/\s*[-–|:]\s*/);
  
  let name = 'Unknown';
  let role = 'Employee';
  
  if (parts.length >= 1) {
    name = parts[0].trim();
  }
  if (parts.length >= 2) {
    role = parts[1].trim();
  }
  
  // Clean up role (e.g. "CEO at Stripe" -> "CEO")
  if (role.toLowerCase().includes(companyName.toLowerCase())) {
    role = role
      .replace(new RegExp(`\\s*at\\s*${companyName}`, 'i'), '')
      .replace(new RegExp(`\\s*-\\s*${companyName}`, 'i'), '')
      .trim();
  }
  
  // Final checks to clean up trailing company names from role
  if (role.endsWith('@') || role.toLowerCase().endsWith(' at')) {
    role = role.replace(/\s*(@|at)\s*$/i, '').trim();
  }
  
  return { name, role };
}

// ─── Current Employee Validator ──────────────────────────────────────────────

function escapeRegex(string: string): string {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function isValidCurrentEmployee(title: string, snippet: string, companyName: string): boolean {
  const cleanTitle = title.replace(/\s*[|:-]\s*LinkedIn$/i, '').trim();
  const parts = cleanTitle.split(/\s*[-–|:]\s*/);
  
  const lowerCompany = companyName.toLowerCase();
  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  const escapedCompany = escapeRegex(lowerCompany);
  
  // 1. Extract name (typically parts[0]) and check if companyName only matches the person's name
  const namePart = (parts[0] || '').toLowerCase();
  
  // Check if company name is in the title outside of the name part
  let companyInTitleOutsideName = false;
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].toLowerCase().includes(lowerCompany)) {
      companyInTitleOutsideName = true;
      break;
    }
  }
  
  // Check if the snippet contains employment indicators with the company name
  const employmentRegex = new RegExp(`\\b(at|of|@|in|for|join|joined|with|current|currently|works at|working at|team at)\\s+${escapedCompany}\\b`, 'i');
  const hasEmploymentIndicator = employmentRegex.test(titleLower) || employmentRegex.test(snippetLower);
  
  // If the company name is ONLY found in the name part and there is no employment indicator, reject it
  const companyInName = namePart.includes(lowerCompany);
  const companyInTitleOrSnippet = titleLower.includes(lowerCompany) || snippetLower.includes(lowerCompany);
  
  if (companyInName && !companyInTitleOutsideName && !hasEmploymentIndicator) {
    console.log(`[Filter] Rejecting "${title}" - company name only matches name part.`);
    return false;
  }
  
  // If the company name is not in the title/snippet at all, reject
  if (!companyInTitleOrSnippet) {
    return false;
  }
  
  // 2. Filter out former/past workers
  let isFormer = false;
  for (const part of parts) {
    const partLower = part.toLowerCase();
    if (partLower.includes(lowerCompany)) {
      if (
        partLower.includes('former') ||
        partLower.includes('ex-') ||
        /\bex\b/.test(partLower) ||
        partLower.includes('previously') ||
        partLower.includes('retired') ||
        partLower.includes('past') ||
        partLower.includes('worked at')
      ) {
        isFormer = true;
        break;
      }
    }
  }
  
  const windowRegex1 = new RegExp(`\\b(former|ex|prev|previously|past|retired|worked at)\\b[^.!?]{1,35}\\b${escapedCompany}\\b`, 'i');
  const windowRegex2 = new RegExp(`\\b${escapedCompany}\\b[^.!?]{1,35}\\b(former|ex|prev|previously|past|retired|worked at)\\b`, 'i');
  
  if (windowRegex1.test(snippetLower) || windowRegex2.test(snippetLower)) {
    // Check if there is a current indicator to override former check
    const currentRegex1 = new RegExp(`\\b(current|currently|present|now|works at|working at)\\b[^.!?]{1,35}\\b${escapedCompany}\\b`, 'i');
    const currentRegex2 = new RegExp(`\\b${escapedCompany}\\b[^.!?]{1,35}\\b(current|currently|present|now|works at|working at)\\b`, 'i');
    const hasCurrent = currentRegex1.test(snippetLower) || currentRegex2.test(snippetLower) || currentRegex1.test(titleLower) || currentRegex2.test(titleLower);
    
    if (!hasCurrent) {
      isFormer = true;
    }
  }
  
  if (isFormer) {
    console.log(`[Filter] Rejecting "${title}" - identified as Former Employee.`);
    return false;
  }
  
  return true;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Apify API token is not configured in .env' },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as PeopleScrapeRequest;
    const { domain, companyName: rawName, roles = ['CEO', 'Founder', 'Owner'], maxResults = 10 } = body;

    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      return NextResponse.json({ error: 'domain parameter is required' }, { status: 400 });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    
    // Guess company name from domain if not provided (e.g. stripe.com -> Stripe)
    const companyName = rawName || cleanDomain.split('.')[0].replace(/\b\w/g, c => c.toUpperCase());

    // Construct search query
    // Example: site:linkedin.com/in/ "Stripe" ("CEO" OR "Founder" OR "Owner")
    const roleTerms = roles.map(r => `"${r}"`).join(' OR ');
    const query = `site:linkedin.com/in/ "${companyName}" (${roleTerms})`;

    console.log(`Searching decision makers with query: "${query}"`);

    const client = new ApifyClient({ token });
    const run = await client.actor('apify/google-search-scraper').call({
      queries: query,
      maxPagesPerQuery: Math.max(1, Math.ceil(maxResults / 10)),
      resultsPerPage: 10,
      countryCode: 'us'
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const searchItems: GoogleSearchItem[] = [];

    for (const item of items) {
      if (item.organicResults && Array.isArray(item.organicResults)) {
        for (const res of item.organicResults) {
          searchItems.push({
            title: res.title || '',
            link: res.url || res.link || '',
            snippet: res.description || res.snippet || ''
          });
        }
      }
    }

    // Filter results to ensure they are actual LinkedIn profiles and belong to the correct company name, filtering out former employees and name overlap cases
    const filteredProfiles = searchItems.filter(item => {
      const link = (item.link || '').toLowerCase();
      const isLinkedIn = link.includes('linkedin.com/in/');
      
      if (!isLinkedIn) return false;
      
      return isValidCurrentEmployee(item.title || '', item.snippet || '', companyName);
    });

    // Resolve MX status once for the domain
    const mxVerified = await verifyDomainMX(cleanDomain);

    const people = filteredProfiles.map(item => {
      const { name, role } = parseLinkedInTitle(item.title || '', companyName);
      const emailInfo = predictEmails(name, cleanDomain);

      return {
        fullName: name,
        role: role,
        linkedinUrl: item.link || '',
        email: emailInfo.email,
        emailFormats: emailInfo.formats,
        mxVerified,
        domain: cleanDomain,
        companyName
      };
    });

    // De-duplicate people list by name
    const seenNames = new Set<string>();
    const uniquePeople = [];
    for (const person of people) {
      const nameKey = person.fullName.toLowerCase().replace(/\s+/g, '');
      if (!seenNames.has(nameKey) && person.fullName !== 'Unknown') {
        seenNames.add(nameKey);
        uniquePeople.push(person);
      }
    }

    return NextResponse.json({
      success: true,
      people: uniquePeople.slice(0, maxResults),
      companyName,
      domain: cleanDomain,
      mxVerified
    });

  } catch (err: any) {
    console.error('People scraping failed:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to search for decision makers' },
      { status: 500 }
    );
  }
}
