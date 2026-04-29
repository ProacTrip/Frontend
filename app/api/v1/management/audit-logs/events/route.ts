// app/api/v1/management/audit-logs/events/route.ts
// Proxy SSE: auditoría en tiempo real (conexión persistente)
// El navegador envía cookies automáticamente via EventSource con credentials: 'include'
// y el proxy las reenvía al backend.

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(req: Request) {
  try {
    const res = await proxyFetch(req, '/v1/management/audit-logs/events');

    if (!res.ok) {
      return new NextResponse(
        `data: {"error":"${res.statusText}"}\n\n`,
        { status: res.status, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    return new NextResponse(res.body, {
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
