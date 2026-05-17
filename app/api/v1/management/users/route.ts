// app/api/v1/management/users/route.ts
//Utilidad: Proxy: listar usuarios con filtros (status, rol, paginación)

// Proxy: Listar usuarios (GET /v1/dashboard/users)
// Paginación por cursor — params: limit, cursor, role, status, search, created_before, created_after

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = new URLSearchParams();
    searchParams.forEach((value, key) => query.set(key, value));

    const response = await apiFetch(`/v1/dashboard/users?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy listUsers:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}
