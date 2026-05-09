// app/api/v1/management/users/[id]/route.ts
//Utilidad: Proxy: ver detalle completo de 1 usuario

// Proxy: Detalle de usuario (GET /v1/management/users/:id)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const response = await apiFetch(`/v1/management/users/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { message: 'Usuario no encontrado' },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error obteniendo usuario' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy getUserDetail:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}