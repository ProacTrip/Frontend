// app/api/v1/management/audit-logs/route.ts
//Utilidad: Proxy: ver historial de acciones con filtros

// Proxy: Consultar logs de auditoría con filtros (GET /v1/management/audit-logs)

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/app/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Reenviar todos los query params al backend
    const query = new URLSearchParams();
    searchParams.forEach((value, key) => query.set(key, value));

    const response = await apiFetch(`/v1/management/audit-logs?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Error obteniendo audit logs' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxy queryAuditLogs:', error);
    return NextResponse.json(
      { message: 'Error interno' },
      { status: 500 }
    );
  }
}