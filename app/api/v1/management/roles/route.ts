// app/api/v1/management/roles/route.ts
// Proxy: listar roles del sistema (para asignación de roles por UUID)

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'authorization header required' },
        { status: 401 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/v1/management/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json().catch(() => ({}));
    
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy error (list roles):', error);
    return NextResponse.json(
      { message: 'internal proxy error' },
      { status: 500 }
    );
  }
}