// app/api/v1/management/users/[id]/route.ts
// Proxy: ver detalle completo de 1 usuario (GET /v1/management/users/:id)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const res = await proxyFetch(req, `/v1/management/users/${id}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy getUserDetail:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}