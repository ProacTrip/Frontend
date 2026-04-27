// app/api/v1/management/users/[id]/block/route.ts
// Proxy: bloquear usuario (POST /v1/management/users/:id/block)

import { NextResponse } from 'next/server';
import { proxyFetch } from '@/app/lib/proxy';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const res = await proxyFetch(req, `/v1/management/users/${id}/block`, {
      method: 'POST',
      body: await req.json(),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxy blockUser:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}