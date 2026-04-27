// app/api/v1/management/users/route.ts
// Proxy: listar usuarios con filtros (status, rol, paginación)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await proxyFetch(req, `/v1/management/users${query ? '?' + query : ''}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy listUsers:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}