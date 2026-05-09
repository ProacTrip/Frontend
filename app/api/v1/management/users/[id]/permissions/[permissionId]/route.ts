// app/api/v1/management/users/[id]/permissions/[permissionId]/route.ts
//Utilidad: Proxy: revocar permiso específico de usuario

// Proxy: Revocar permiso override (DELETE /v1/management/users/:id/permissions/:permissionId)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const { id, permissionId } = params;

    const response = await apiFetch(`/v1/management/users/${id}/permissions/${permissionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error revocando permiso' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy revokePermission:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}