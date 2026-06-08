// =============================================================================
// PitchRadar — AI Email Generation (SSE)
// POST /api/ai/email
// Generates hyper-personalized cold outreach emails using Claude or templates
// =============================================================================

import { NextResponse } from 'next/server';

interface EmailGenRequest {
  company_name: string;
  website: string;
  email: string;
  niche: string;
  location: string;
  rating: number;
  review_count: number;
  ai_score: number;
  seo_score: number;
  gaps: string[];
  platform: string;
  site_speed: string;
  ssl_status: string;
  est_revenue_loss: number;
  vulnerabilities: string[];
  angle: 'seo' | 'redesign' | 'ads' | 'social' | 'general';
  tone: 'professional' | 'casual' | 'urgent';
  recent_posts?: any[];
  decision_maker?: string;
}

interface EmailResult {
  subject: string;
  body: string;
  followUpSubject: string;
  followUpBody: string;
}

// ─── Template-based fallback email generation ────────────────────────────────

function generateTemplateEmail(lead: EmailGenRequest): EmailResult {
  const name = lead.decision_maker && lead.decision_maker !== 'N/A'
    ? lead.decision_maker
    : 'Team';
  const company = lead.company_name || 'your business';
  const loss = lead.est_revenue_loss || 1200;
  const gapsStr = (lead.gaps || []).join(', ').toLowerCase() || 'digital marketing optimization';

  const templates: Record<string, EmailResult> = {
    seo: {
      subject: `${company}: Your website is invisible to ${lead.location || 'local'} customers`,
      body: `Hi ${name},\n\nI was researching ${lead.niche || 'businesses'} in ${lead.location || 'your area'} and ran a technical scan on ${lead.website || 'your website'}.\n\nHere's what I found:\n• SEO Score: ${lead.seo_score || 35}/100 (industry average is 65+)\n• Key Issues: ${(lead.vulnerabilities || []).slice(0, 3).join(', ') || 'Missing meta tags, weak heading structure'}\n• Platform: ${lead.platform || 'Unknown'}\n\nThis means Google has difficulty understanding your pages, and potential customers searching for ${lead.niche || 'your services'} in ${lead.location || 'your area'} are finding your competitors instead.\n\nOur quick analysis estimates this is costing approximately $${loss.toLocaleString()}/month in lost leads.\n\nI'd love to share a free 5-minute audit showing exactly where the quick wins are. Would Thursday or Friday work for a brief call?\n\nBest regards,\n[Your Name]`,
      followUpSubject: `Quick follow-up: ${company} SEO opportunities`,
      followUpBody: `Hi ${name},\n\nJust following up on my note last week about the SEO gaps I found on ${lead.website || 'your site'}.\n\nI've put together a short list of 3 quick wins that could improve your local search visibility within 30 days — no major website changes needed.\n\nWould you like me to send it over?\n\nBest,\n[Your Name]`,
    },
    redesign: {
      subject: `Is ${company}'s website turning away mobile customers?`,
      body: `Hi ${name},\n\nI came across ${company} while researching ${lead.niche || 'top businesses'} in ${lead.location || 'your area'} and noticed your website could be working harder for you.\n\nA few things stood out:\n• Speed: ${lead.site_speed || 'Below average'} (47% of visitors leave if a page takes more than 2 seconds)\n• SSL Security: ${lead.ssl_status || 'Needs attention'}\n• Platform: ${lead.platform || 'Could benefit from an upgrade'}\n\nWith ${lead.review_count || 'your'} positive reviews, your reputation is strong — but your website may not be converting that reputation into new customers.\n\nOur analysis suggests you could be losing ~$${loss.toLocaleString()}/month from visitors who land on your site but leave before reaching out.\n\nI build fast, conversion-optimized websites specifically for ${lead.niche || 'businesses like yours'}. Can I show you a 2-minute video mockup of what a redesigned site could look like?\n\nSincerely,\n[Your Name]`,
      followUpSubject: `${company} — free website mockup offer`,
      followUpBody: `Hi ${name},\n\nI wanted to circle back on my previous message. I've actually gone ahead and sketched a rough concept for how a modernized ${company} website could look.\n\nIt includes mobile optimization, fast loading, and a clear call-to-action flow that converts visitors into leads.\n\nWould you be open to a quick 10-minute screen share this week? No pressure at all.\n\nBest,\n[Your Name]`,
    },
    ads: {
      subject: `${company}: You're paying for traffic but losing 98% of visitors`,
      body: `Hello ${name},\n\n${company} has a solid presence in ${lead.location || 'your market'} with ${lead.review_count || 'strong'} reviews. However, our scan detected that you don't have retargeting pixels installed on your website.\n\nThis means:\n• Every visitor who leaves without contacting you is gone forever\n• You can't show follow-up ads on Google, Facebook, or Instagram\n• Your competitors who DO have pixels are re-engaging YOUR potential customers\n\nSetting up proper tracking and a targeted ad campaign for ${lead.niche || 'your industry'} typically generates 3-5x ROI within the first 60 days.\n\nI specialize in building high-ROI ad campaigns for ${lead.niche || 'local businesses'}. Would you have 15 minutes this week for a quick strategy session?\n\nRegards,\n[Your Name]`,
      followUpSubject: `Re: Ad tracking for ${company}`,
      followUpBody: `Hi ${name},\n\nQuick follow-up — I noticed that several of your competitors in ${lead.location || 'your area'} are running active retargeting campaigns.\n\nThis means they're showing ads to people who visited your website but chose their business instead.\n\nI can set up a basic retargeting system in under 48 hours. Want me to send you a quick proposal?\n\nBest,\n[Your Name]`,
    },
    social: {
      subject: `${company} is missing out on free ${lead.location || 'local'} customers`,
      body: `Hi ${name},\n\nI was looking at ${lead.niche || 'top-rated businesses'} in ${lead.location || 'your area'} and noticed ${company}'s social media presence could use some attention.\n\nWith ${lead.rating || 'great'} ratings and ${lead.review_count || 'solid'} reviews, you clearly deliver excellent service. But without a consistent social media strategy, you're leaving free customers on the table.\n\nHere's what I'd recommend:\n• Set up or optimize Instagram and Facebook business profiles\n• Post 3-4x per week with before/after content, testimonials, and local community posts\n• Run targeted local ads to people within 15 miles of your business\n\nBusinesses in ${lead.niche || 'your industry'} that implement this see an average 40% increase in inbound inquiries within 90 days.\n\nWould you like me to put together a free content calendar for ${company}?\n\nBest regards,\n[Your Name]`,
      followUpSubject: `Free social media audit for ${company}`,
      followUpBody: `Hi ${name},\n\nFollowing up on my note about ${company}'s social media opportunities.\n\nI put together a quick competitive analysis showing what your top 3 competitors are posting and how they're generating leads through social media.\n\nWould you like me to share it?\n\nBest,\n[Your Name]`,
    },
    general: {
      subject: `Growth opportunity for ${company} — quick question`,
      body: `Hi ${name},\n\nI've been researching ${lead.niche || 'leading businesses'} in ${lead.location || 'your area'} and ${company} caught my attention.\n\nAfter a quick review, I identified ${(lead.gaps || []).length || 'several'} areas where your online presence could be generating significantly more leads:\n\n${(lead.gaps || []).map(g => `• ${g === 'SEO' ? 'Search engine optimization' : g === 'WEB' ? 'Website performance' : g === 'SOCIAL' ? 'Social media presence' : g === 'ADS' ? 'Digital advertising' : g === 'EMAIL' ? 'Email marketing' : g}`).join('\n') || '• Digital marketing optimization'}\n\nOur analysis estimates these gaps may be costing approximately $${loss.toLocaleString()}/month in missed opportunities.\n\nI help businesses like ${company} close these gaps and turn their online presence into a lead generation machine. Would you be open to a brief conversation about how I can help?\n\nBest regards,\n[Your Name]`,
      followUpSubject: `Re: Growth opportunity for ${company}`,
      followUpBody: `Hi ${name},\n\nJust wanted to follow up on my previous message. I understand you're busy running ${company}!\n\nI've helped several ${lead.niche || 'businesses'} in ${lead.location || 'the area'} increase their online leads by 50-200%. Happy to share case studies if that would be helpful.\n\nWould a quick 10-minute call work sometime this week?\n\nBest,\n[Your Name]`,
    },
  };

  return templates[lead.angle] || templates.general;
}

// ─── Claude API email generation ─────────────────────────────────────────────

async function generateWithClaude(lead: EmailGenRequest): Promise<ReadableStream> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const name = lead.decision_maker && lead.decision_maker !== 'N/A' ? lead.decision_maker : 'the business owner';

  const toneInstructions = {
    professional: 'Use a polished, corporate tone. Be respectful and data-driven.',
    casual: 'Use a friendly, conversational tone. Be approachable and genuine.',
    urgent: 'Create urgency without being pushy. Emphasize time-sensitive opportunity and competitive pressure.',
  };

  const systemPrompt = `You are an elite B2B cold email copywriter. Write hyper-personalized outreach emails that get replies.

Rules:
- ${toneInstructions[lead.tone] || toneInstructions.professional}
- Reference specific data points from the lead analysis
- Keep emails under 150 words (short = higher reply rate)
- Include a clear, low-friction CTA
- No generic filler — every sentence must earn its place
- Address ${name} by name if possible

Respond with ONLY valid JSON:
{
  "subject": "compelling subject line under 60 chars",
  "body": "email body with \\n for line breaks",
  "followUpSubject": "follow-up subject line",
  "followUpBody": "follow-up email body sent 3 days later"
}`;

  const angleDescriptions = {
    seo: 'Focus on their SEO gaps and search visibility problems.',
    redesign: 'Focus on website design issues, speed, and platform limitations.',
    ads: 'Focus on missing ad pixels and retargeting opportunities.',
    social: 'Focus on social media presence gaps and engagement opportunities.',
    general: 'Take a general digital growth approach, touching on the most impactful gaps.',
  };

  const userPrompt = `Write a cold email for this lead:

Company: ${lead.company_name}
Contact: ${name}
Industry: ${lead.niche}
Location: ${lead.location}
Website: ${lead.website}
Rating: ${lead.rating}/5 (${lead.review_count} reviews)
SEO Score: ${lead.seo_score}/100
Platform: ${lead.platform}
Speed: ${lead.site_speed}
SSL: ${lead.ssl_status}
Gaps: ${(lead.gaps || []).join(', ')}
Top Issues: ${(lead.vulnerabilities || []).slice(0, 3).join('; ')}
Est. Monthly Loss: $${(lead.est_revenue_loss || 0).toLocaleString()}
${lead.recent_posts && lead.recent_posts.length > 0 ? `Recent Social Media Posts from Lead:\n${lead.recent_posts.map((p, i) => `[Post ${i+1}]: ${p.text || p.content}`).join('\n')}\n` : ''}
Angle: ${lead.angle} — ${angleDescriptions[lead.angle] || angleDescriptions.general}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${errorText}`);
  }

  return response.body!;
}

// ========== MAIN POST HANDLER ==========

export async function POST(req: Request) {
  let lead: EmailGenRequest;
  try {
    lead = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!lead.company_name) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  // Default angle and tone
  lead.angle = lead.angle || 'general';
  lead.tone = lead.tone || 'professional';

  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;

  // If no Claude API key, return template-based email
  if (!hasClaudeKey) {
    const result = generateTemplateEmail(lead);
    return NextResponse.json({ ...result, source: 'template' });
  }

  // Stream from Claude
  try {
    const claudeStream = await generateWithClaude(lead);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = claudeStream.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullContent += parsed.delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: parsed.delta.text })}\n\n`));
                  }
                } catch {
                  // Skip unparseable
                }
              }
            }
          }

          // Parse complete response
          try {
            const result = JSON.parse(fullContent);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result, source: 'claude' })}\n\n`));
          } catch {
            const fallback = generateTemplateEmail(lead);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result: fallback, source: 'template-fallback' })}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          const fallback = generateTemplateEmail(lead);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result: fallback, source: 'template-fallback' })}\n\n`));
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
      },
    });
  } catch (err: any) {
    const result = generateTemplateEmail(lead);
    return NextResponse.json({ ...result, source: 'template-fallback', error: err.message });
  }
}
