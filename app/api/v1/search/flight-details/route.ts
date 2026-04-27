import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.booking_token) {
      return NextResponse.json(
        { error: 'Se requiere booking_token' },
        { status: 400 }
      );
    }

    const res = await proxyFetch(req, '/v1/search/flight-details', {
      method: 'POST',
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}