// app/api/v1/notifications/templates/route.ts
// Proxy: listar (GET), crear (POST) y actualizar (PUT) plantillas

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await proxyFetch(req, `/v1/notifications/templates${query ? '?' + query : ''}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (list templates):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/notifications/templates', {
      method: 'POST',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (create template):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/notifications/templates', {
      method: 'PUT',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (update template):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}