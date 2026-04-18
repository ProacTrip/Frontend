import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await apiFetch('/v1/search/hotel-rooms', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error buscando habitaciones' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error proxy hotel-rooms:', error);
    return NextResponse.json(
      { message: 'Error interno' }, 
      { status: 500 }
    );
  }
}