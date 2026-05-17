// app/api/v1/management/users/[id]/block/route.ts
// Proxy: Actualizar estado de cuenta (PUT /v1/dashboard/users/:id/status)
// Reemplaza los viejos endpoints /block y /unblock.
// Body: { status: "active" | "disabled" }

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await apiFetch(`/v1/dashboard/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy updateAccountStatus:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}
