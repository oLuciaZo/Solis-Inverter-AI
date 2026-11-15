import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendBase = process.env.BACKEND_URL || 'http://localhost:4000';
  const search = request.nextUrl.search;
  const targetUrl = `${backendBase}/api/solis/${path.join('/')}${search}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: request.headers.get('accept') || 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend unreachable', details: String(error) },
      { status: 502 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendBase = process.env.BACKEND_URL || 'http://localhost:4000';
  const search = request.nextUrl.search;
  const targetUrl = `${backendBase}/api/solis/${path.join('/')}${search}`;

  try {
    const body = await request.text();
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        Accept: request.headers.get('accept') || 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend unreachable', details: String(error) },
      { status: 502 },
    );
  }
}
