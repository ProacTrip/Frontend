// app/api/v1/management/roles/route.ts
// Proxy: listar roles del sistema (para asignación de roles por UUID)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/management/roles');
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (list roles):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}