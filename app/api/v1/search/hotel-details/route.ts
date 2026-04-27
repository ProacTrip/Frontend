import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/search/hotel-details', {
      method: 'POST',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy hotel-details:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}