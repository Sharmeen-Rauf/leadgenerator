import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Claude API key is not configured in .env' }, { status: 400 });
    }

    const payload: any = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Claude API error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Demo Claude proxy failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to call Claude API' }, { status: 500 });
  }
}
