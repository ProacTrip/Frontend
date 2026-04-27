// app/api/v1/management/avatars/default/route.ts
// Proxy: listar avatares (GET) + generar URL subida (POST)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ttl = searchParams.get('ttl_minutes');
    const query = ttl ? `?ttl_minutes=${ttl}` : '';

    const res = await proxyFetch(req, `/v1/management/avatars/default${query}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy listAvatars:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/management/avatars/default', {
      method: 'POST',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy uploadAvatar:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}