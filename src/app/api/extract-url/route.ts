import { NextRequest, NextResponse } from 'next/server';
import { extractFromUrl } from '@/lib/blotato';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "url" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid URL including the protocol (e.g. https://).' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const content = await extractFromUrl(body.url);

    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error extracting URL content';
    console.error('[POST /api/extract-url]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
