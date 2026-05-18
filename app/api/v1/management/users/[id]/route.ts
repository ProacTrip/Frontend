// app/api/v1/management/users/[id]/route.ts
//Utilidad: Proxy: ver detalle completo de 1 usuario

// Proxy: Detalle de usuario (GET /v1/dashboard/users/:id)
// Responde: { user: UserAdminDetail, effective_permissions: string[] }

import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyFetch(request, `/v1/dashboard/users/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      if (errorBody) {
        return NextResponse.json(errorBody, { status: response.status });
      }
      return new NextResponse(null, { status: response.status });
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
