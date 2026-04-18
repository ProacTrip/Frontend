import { NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.booking_token) {
      return NextResponse.json(
        { error: 'Se requiere booking_token' },
        { status: 400 }
      );
    }

    const response = await apiFetch('/v1/search/flight-details', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener detalles' },
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