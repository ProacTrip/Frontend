import { NextResponse } from 'next/server';

// URL del backend de Marco Aurelio (del servidor, no pública)
const MARCO_API_URL = process.env.MARCO_API_URL || 'http://localhost:8080';
const MARCO_API_KEY = process.env.MARCO_API_KEY; // Sin NEXT_PUBLIC_, solo servidor

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${MARCO_API_URL}/v1/search/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MARCO_API_KEY || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Error del backend' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error interno' }, 
      { status: 500 }
    );
  }
}