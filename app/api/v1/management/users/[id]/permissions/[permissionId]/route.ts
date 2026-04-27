// app/api/v1/management/users/[id]/permissions/[permissionId]/route.ts
// Proxy: revocar permiso override (DELETE /v1/management/users/:id/permissions/:permissionId)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const { id, permissionId } = params;

    const res = await proxyFetch(req, `/v1/management/users/${id}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy revokePermission:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}