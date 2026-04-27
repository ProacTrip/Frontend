// app/api/v1/notifications/templates/toggle/route.ts
// Proxy: activar/desactivar plantilla (PUT)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function PUT(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/notifications/templates/toggle', {
      method: 'PUT',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (toggle template):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}