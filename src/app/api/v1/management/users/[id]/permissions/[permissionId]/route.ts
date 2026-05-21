// app/api/v1/management/users/[id]/permissions/[permissionId]/route.ts
// Proxy: DELETE /v1/dashboard/users/:id/permission-overrides/:overrideId
// Elimina un override de permiso e invalida la sesión cacheada del usuario (best-effort).

import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  try {
    const { id, permissionId } = await params;

    const response = await proxyFetch(
      request,
      `/v1/dashboard/users/${id}/permission-overrides/${permissionId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error proxy deletePermissionOverride:', error);
    return NextResponse.json({ title: 'Error interno', status: 500 }, { status: 500 });
  }
}
