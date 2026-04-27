// app/api/v1/notifications/route.ts
// Proxy: listar notificaciones del usuario autenticado (GET)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await proxyFetch(req, `/v1/notifications${query ? '?' + query : ''}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (list user notifications):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}