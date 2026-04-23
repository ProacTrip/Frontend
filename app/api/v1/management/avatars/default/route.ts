// app/api/v1/management/avatars/default/route.ts
//Utilidad: Proxy: listar avatares + generar URL para subir nuevos

// Proxy: Listar avatares (GET) + Generar URL subida (POST)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

/**
 * GET /api/v1/management/avatars/default
 * Proxy para: GET /v1/management/avatars/default
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ttl = searchParams.get('ttl_minutes');

    const query = ttl ? `?ttl_minutes=${ttl}` : '';

    const response = await apiFetch(`/v1/management/avatars/default${query}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error obteniendo avatares' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy listAvatars:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/management/avatars/default
 * Proxy para: POST /v1/management/avatars/default
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await apiFetch('/v1/management/avatars/default', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error generando URL de subida' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy uploadAvatar:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}