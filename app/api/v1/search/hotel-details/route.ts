import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await apiFetch('/v1/search/hotel-details', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Hotel no encontrado' }, 
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || `Error ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error proxy hotel-details:', error);
    return NextResponse.json(
      { message: 'Error interno' }, 
      { status: 500 }
    );
  }
}