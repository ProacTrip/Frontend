// app/api/v1/management/audit-logs/events/route.ts
//Utilidad: Proxy SSE: auditoría en tiempo real (conexión persistente)

// Proxy SSE: Auditoría en tiempo real (GET /v1/management/audit-logs/events)
// NOTA: EventSource del navegador no soporta headers custom, 
// así que el token se pasa por query param

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        'data: {"error":"token requerido"}\n\n',
        { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    // Conectar con backend SSE
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/v1/management/audit-logs/events?token=${encodeURIComponent(token)}`;
    
    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      return new NextResponse(
        `data: {"error":"${backendResponse.statusText}"}\n\n`,
        { status: backendResponse.status, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    // Pipe directo del stream del backend al cliente
    // Esto mantiene la conexión abierta para SSE
    return new NextResponse(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error proxy SSE audit:', error);
    return new NextResponse(
      'data: {"error":"Error interno"}\n\n',
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }
}

/*
Este proxy es especial porque:
No usa apiFetch (necesita pasar el token por query para que EventSource del navegador funcione)
Devuelve un stream abierto en lugar de JSON cerrado
El frontend se conecta con new EventSource('/api/v1/management/audit-logs/events?token=...')
Si Marco Aurelio no tiene el SSE activo todavía, este archivo no hará nada hasta que lo implemente. Pero lo dejamos preparado.
*/