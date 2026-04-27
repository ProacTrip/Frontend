// app/api/v1/notifications/read-all/route.ts
// Proxy: marcar todas las notificaciones como leídas (PUT)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function PUT(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/notifications/read-all', { method: 'PUT' });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (mark all notifications read):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}