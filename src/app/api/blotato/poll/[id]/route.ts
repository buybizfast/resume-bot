import { NextRequest, NextResponse } from 'next/server';
import { pollResult } from '@/lib/blotato';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing query ID parameter.' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const result = await pollResult(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error polling Blotato result';
    console.error('[GET /api/blotato/poll/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
