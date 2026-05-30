// =============================================================================
// PitchRadar — AI Lead Scoring (SSE)
// POST /api/ai/score
// Analyzes a lead and returns opportunity analysis, action plan, and ROI estimate
// Uses Claude API if ANTHROPIC_API_KEY is set, otherwise falls back to templates
// =============================================================================

import { NextResponse } from 'next/server';

interface LeadScoreRequest {
  company_name: string;
  website: string;
  email: string;
  phone: string;
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
  opportunity_temp: string;
}

interface AIScoreResult {
  opportunityAnalysis: string[];
  actionPlan: string[];
  estimatedROI: string;
  riskAssessment: string;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidenceScore: number;
}

// ─── Template-based fallback scoring ─────────────────────────────────────────

function generateTemplateScore(lead: LeadScoreRequest): AIScoreResult {
  const gaps = lead.gaps || [];
  const score = lead.ai_score || 0;
  const loss = lead.est_revenue_loss || 0;

  // Opportunity Analysis
  const analysis: string[] = [];
  if (gaps.includes('SEO') || gaps.includes('seo')) {
    analysis.push(`SEO score of ${lead.seo_score}/100 indicates significant organic visibility gaps — competitors are capturing their potential search traffic.`);
  }
  if (gaps.includes('WEB') || gaps.includes('web')) {
    analysis.push('No professional website detected — this is the single biggest conversion barrier for any modern business.');
  }
  if (gaps.includes('SOCIAL') || gaps.includes('social')) {
    analysis.push('Limited social media presence reduces brand authority and eliminates a major customer acquisition channel.');
  }
  if (gaps.includes('ADS') || gaps.includes('ads')) {
    analysis.push('No active advertising pixels detected — unable to retarget website visitors or measure ad campaign ROI.');
  }
  if (gaps.includes('EMAIL') || gaps.includes('email')) {
    analysis.push('No discoverable email contact — makes direct outreach and lead nurturing difficult.');
  }
  if (lead.platform === 'Wix' || lead.platform === 'GoDaddy') {
    analysis.push(`Currently on ${lead.platform} — limited scalability, poor SEO capabilities, and unprofessional for B2B clients.`);
  }
  if (lead.ssl_status?.toLowerCase().includes('invalid')) {
    analysis.push('Missing SSL certificate triggers browser security warnings, immediately destroying visitor trust.');
  }
  if (analysis.length === 0) {
    analysis.push('Lead shows moderate digital maturity — focus on optimization and conversion rate improvements.');
  }

  // Action Plan
  const plan: string[] = [];
  if (gaps.includes('WEB') || gaps.includes('web') || lead.platform === 'Wix' || lead.platform === 'GoDaddy') {
    plan.push('Priority 1: Propose a professional website redesign with modern framework, mobile optimization, and fast load times.');
  }
  if (gaps.includes('SEO') || gaps.includes('seo') || lead.seo_score < 50) {
    plan.push('Priority 2: Offer an SEO audit package — fix meta tags, structured data, and content optimization for local search dominance.');
  }
  if (gaps.includes('ADS') || gaps.includes('ads')) {
    plan.push('Priority 3: Set up retargeting pixel infrastructure (Facebook, Google Ads) to capture lost visitor intent.');
  }
  if (gaps.includes('SOCIAL') || gaps.includes('social')) {
    plan.push('Priority 4: Build social media management package — Instagram and Facebook business profiles with consistent posting.');
  }
  plan.push(`Priority ${plan.length + 1}: Schedule discovery call to understand their current marketing spend and growth goals.`);

  // Grade
  let grade: AIScoreResult['overallGrade'] = 'C';
  if (score >= 75) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else if (score >= 20) grade = 'D';
  else grade = 'F';

  // ROI Estimate
  const annualLoss = loss * 12;
  const roi = annualLoss > 0
    ? `Estimated $${(annualLoss * 0.3).toLocaleString()} - $${(annualLoss * 0.6).toLocaleString()} annual ROI potential by addressing identified gaps.`
    : 'ROI potential is moderate — focus on establishing baseline metrics first.';

  // Risk Assessment
  const risks: string[] = [];
  if (lead.review_count < 5) risks.push('Very few reviews suggest a new or struggling business — may have limited budget.');
  if (lead.rating > 0 && lead.rating < 3.0) risks.push('Low rating indicates potential service quality issues — may be difficult to retain.');
  if (!lead.email || lead.email === 'N/A') risks.push('No email found — cold outreach will require phone or social channels.');
  const riskText = risks.length > 0 ? risks.join(' ') : 'Low risk — business shows stable fundamentals with clear improvement opportunities.';

  return {
    opportunityAnalysis: analysis.slice(0, 5),
    actionPlan: plan.slice(0, 5),
    estimatedROI: roi,
    riskAssessment: riskText,
    overallGrade: grade,
    confidenceScore: Math.min(95, 60 + gaps.length * 8),
  };
}

// ─── Claude API call with streaming ──────────────────────────────────────────

async function scoreWithClaude(lead: LeadScoreRequest): Promise<ReadableStream> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  const systemPrompt = `You are an elite B2B sales intelligence analyst for a digital marketing agency. Your job is to analyze business leads and provide actionable intelligence for sales teams.

Respond with ONLY valid JSON matching this exact schema:
{
  "opportunityAnalysis": ["string — 3-5 bullet points about the lead's digital gaps and why they're opportunities"],
  "actionPlan": ["string — 3-5 prioritized action steps for the sales team"],
  "estimatedROI": "string — estimated ROI if the lead signs up for services",
  "riskAssessment": "string — potential risks or objections",
  "overallGrade": "A|B|C|D|F",
  "confidenceScore": number between 0-100
}

Be specific, data-driven, and reference the actual metrics provided. No fluff.`;

  const userPrompt = `Analyze this lead:

Company: ${lead.company_name}
Industry: ${lead.niche}
Location: ${lead.location}
Website: ${lead.website}
Platform: ${lead.platform}
Rating: ${lead.rating}/5 (${lead.review_count} reviews)
AI Opportunity Score: ${lead.ai_score}/100
SEO Score: ${lead.seo_score}/100
Site Speed: ${lead.site_speed}
SSL: ${lead.ssl_status}
Detected Gaps: ${(lead.gaps || []).join(', ') || 'None detected'}
Vulnerabilities: ${(lead.vulnerabilities || []).slice(0, 5).join('; ') || 'None'}
Estimated Monthly Revenue Loss: $${(lead.est_revenue_loss || 0).toLocaleString()}
Temperature: ${lead.opportunity_temp}`;

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
  let lead: LeadScoreRequest;
  try {
    lead = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!lead.company_name) {
    return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
  }

  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;

  // If no Claude API key, return template-based analysis
  if (!hasClaudeKey) {
    const result = generateTemplateScore(lead);
    return NextResponse.json({ ...result, source: 'template' });
  }

  // Stream from Claude
  try {
    const claudeStream = await scoreWithClaude(lead);
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
                  // Skip unparseable lines
                }
              }
            }
          }

          // Try to parse the full content as JSON and send final result
          try {
            const result = JSON.parse(fullContent);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result, source: 'claude' })}\n\n`));
          } catch {
            // If Claude didn't return valid JSON, fall back to template
            const fallback = generateTemplateScore(lead);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result: fallback, source: 'template-fallback' })}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const fallback = generateTemplateScore(lead);
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
    // Fall back to template on any error
    const result = generateTemplateScore(lead);
    return NextResponse.json({ ...result, source: 'template-fallback', error: err.message });
  }
}
