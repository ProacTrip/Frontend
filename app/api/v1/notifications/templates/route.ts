// app/api/v1/notifications/templates/route.ts
// Proxy: listar (GET), crear (POST) y actualizar (PUT) plantillas

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'authorization header required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();

    const res = await fetch(`${BACKEND_URL}/v1/notifications/templates${query ? '?' + query : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (list templates):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'authorization header required' }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/v1/notifications/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (create template):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'authorization header required' }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/v1/notifications/templates`, {
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
    console.error('Proxy error (update template):', error);
    return NextResponse.json({ message: 'internal proxy error' }, { status: 500 });
  }
}