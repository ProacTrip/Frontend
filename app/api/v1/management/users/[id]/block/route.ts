// app/api/v1/management/users/[id]/block/route.ts
//Utilidad: Proxy: bloquear usuario X durante N días

// Proxy: Bloquear usuario (POST /v1/management/users/:id/block)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const response = await apiFetch(`/v1/management/users/${id}/block`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error bloqueando usuario' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy blockUser:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}