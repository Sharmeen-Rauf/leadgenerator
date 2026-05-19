import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { placeUrl, placeName } = await req.json();
    const token = process.env.APIFY_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 500 });

    const res = await fetch(
      `https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: placeUrl ? [{ url: placeUrl }] : [],
          searchStringsArray: placeUrl ? [] : [placeName],
          maxReviews: 30,
          language: 'en',
          personalData: true,
        }),
      }
    );

    const data = await res.json();
    if (!Array.isArray(data)) return NextResponse.json({ reviews: [], stats: null });

    // Parse reviews
    const reviews = data.map((r: any) => ({
      author: r.name || r.author || 'Anonymous',
      rating: r.stars || r.rating || 0,
      text: r.text || r.reviewText || '',
      date: r.publishedAtDate || r.date || '',
      likes: r.likesCount || 0,
      isLocal: r.isLocalGuide || false,
      response: r.responseFromOwnerText || null,
    }));

    // Calculate stats
    const dist = [0, 0, 0, 0, 0];
    let positive = 0, negative = 0, neutral = 0;
    reviews.forEach((r: any) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
      if (r.rating >= 4) positive++;
      else if (r.rating <= 2) negative++;
      else neutral++;
    });
    const avg = reviews.length
      ? +(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    const responded = reviews.filter((r: any) => r.response).length;

    return NextResponse.json({
      reviews,
      stats: {
        total: reviews.length,
        average: avg,
        distribution: dist,
        positive,
        negative,
        neutral,
        responseRate: reviews.length ? Math.round((responded / reviews.length) * 100) : 0,
        sentiment: positive > negative * 2 ? 'positive' : negative > positive ? 'negative' : 'mixed',
      },
    });
  } catch (error: any) {
    console.error('Reviews error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
