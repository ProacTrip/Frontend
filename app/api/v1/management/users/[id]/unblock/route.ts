// app/api/v1/management/users/[id]/unblock/route.ts
// DEPRECATED: El endpoint /unblock ya no existe en el Dashboard API.
// Usar PUT /v1/dashboard/users/:id/status con body { status: "active" }.
// Este handler redirige la llamada al nuevo endpoint por compatibilidad.

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const response = await apiFetch(`/v1/dashboard/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy unblock→status:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}
