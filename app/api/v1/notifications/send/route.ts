// app/api/v1/notifications/send/route.ts
// Proxy: enviar notificación manual a un usuario (POST)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/notifications/send', {
      method: 'POST',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (send notification):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}