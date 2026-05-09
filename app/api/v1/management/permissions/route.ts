// app/api/v1/management/permissions/route.ts
//Utilidad: Proxy: listar todos los permisos disponibles del sistema

// Proxy: Listar todos los permisos del sistema (GET /v1/management/permissions)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const response = await apiFetch('/v1/management/permissions', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error obteniendo permisos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy listPermissions:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}