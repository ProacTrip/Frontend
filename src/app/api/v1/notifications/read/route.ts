// app/api/v1/notifications/read/route.ts
// Proxy: marcar una notificación como leída (PUT)

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'authorization header required' }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`${API_URL}/v1/notifications/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (mark notification read):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}