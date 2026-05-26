import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = /^https:\/\/lh[3-6]\.googleusercontent\.com\//;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  if (!ALLOWED_ORIGINS.test(url)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Proactrip/1.0)' },
    });
  } catch {
    return new NextResponse('Upstream unreachable', { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
