// app/api/v1/management/audit-logs/events/route.ts
// Utilidad: Proxy SSE: auditoría en tiempo real (conexión persistente)
// Auth via cookie-forward — el proxy reenvía las cookies HttpOnly del navegador al backend.
// No se expone ningún token en la URL ni en el cliente.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    // Conectar con backend SSE
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/v1/management/audit-logs/events`;

    const backendResponse = await fetch(backendUrl, {
      headers: {
        'Accept': 'text/event-stream',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
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