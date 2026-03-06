import { NextRequest, NextResponse } from 'next/server';
import { createQuery } from '@/lib/blotato';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "query" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const id = await createQuery(body.query);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating Blotato query';
    console.error('[POST /api/blotato/query]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
