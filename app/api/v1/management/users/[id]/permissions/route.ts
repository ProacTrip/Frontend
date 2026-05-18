// app/api/v1/management/users/[id]/permissions/route.ts
// Proxy: Permission Overrides
//   GET    /v1/dashboard/users/:id/permission-overrides — listar overrides
//   POST   /v1/dashboard/users/:id/permission-overrides — crear override

import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyFetch(request, `/v1/dashboard/users/${id}/permission-overrides`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy getPermissionOverrides:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await proxyFetch(request, `/v1/dashboard/users/${id}/permission-overrides`, {
      method: 'POST',
      body: body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error proxy createPermissionOverride:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}
