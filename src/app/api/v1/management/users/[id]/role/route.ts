// app/api/v1/management/users/[id]/role/route.ts
//Utilidad: Proxy: cambiar rol de usuario (client → admin)

// Proxy: Asignar rol a usuario (POST /v1/management/users/:id/role)

import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await proxyFetch(request, `/v1/management/users/${id}/role`, {
      method: 'POST',
      body: body,
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
    console.error('Error proxy assignRole:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}