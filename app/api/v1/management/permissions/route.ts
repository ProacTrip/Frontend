// app/api/v1/management/permissions/route.ts
// Proxy: listar todos los permisos del sistema (GET /v1/management/permissions)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/management/permissions');
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy listPermissions:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}