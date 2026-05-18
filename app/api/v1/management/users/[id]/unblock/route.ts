// app/api/v1/management/users/[id]/unblock/route.ts
// DEPRECATED: El endpoint /unblock ya no existe en el Dashboard API.
// Usar PUT /v1/dashboard/users/:id/status con body { status: "active" }.
// Este handler redirige la llamada al nuevo endpoint por compatibilidad.

import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyFetch(request, `/v1/dashboard/users/${id}/status`, {
      method: 'PUT',
      body: { status: 'active' },
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
