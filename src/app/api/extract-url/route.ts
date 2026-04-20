import { NextRequest, NextResponse } from 'next/server';
import { extractFromUrl } from '@/lib/blotato';

async function fetchUrlDirectly(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`Direct fetch failed: ${response.status}`);
  }

  const html = await response.text();

  // Strip scripts, styles, and HTML tags; collapse whitespace
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, '\n\n')
    .trim();

  if (text.length < 100) {
    throw new Error('Page returned insufficient content — it may require JavaScript or block automated access.');
  }

  return text;
}

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

    // Try Blotato first, fall back to direct fetch
    let content: string;
    if (process.env.BLOTATO_API_KEY) {
      try {
        content = await extractFromUrl(body.url);
      } catch (blatoErr) {
        console.warn('[POST /api/extract-url] Blotato failed, trying direct fetch:', blatoErr instanceof Error ? blatoErr.message : blatoErr);
        content = await fetchUrlDirectly(body.url);
      }
    } else {
      content = await fetchUrlDirectly(body.url);
    }

    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error extracting URL content';
    console.error('[POST /api/extract-url]', message);
    return NextResponse.json(
      { error: `Could not extract job description from this URL. Try copying and pasting the job description text directly instead. (${message})` },
      { status: 500 }
    );
  }
}
