import { NextRequest, NextResponse } from 'next/server';
import { extractFromUrl } from '@/lib/blotato';

// Sites known to block automated fetching via Cloudflare or similar.
// We short-circuit with a helpful message instead of failing opaquely.
const BLOCKED_HOSTS = [
  'indeed.com',
  'linkedin.com',
  'glassdoor.com',
  'ziprecruiter.com',
];

class BlockedSiteError extends Error {
  constructor(host: string) {
    super(`${host} blocks automated fetching. Please copy the job description text and paste it into the "Paste Text" tab instead.`);
    this.name = 'BlockedSiteError';
  }
}

function isBlockedHost(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const match = BLOCKED_HOSTS.find((h) => host === h || host.endsWith(`.${h}`));
    return match ?? null;
  } catch {
    return null;
  }
}

// Cloudflare / anti-bot challenge pages slip past status checks with a 200 OK.
// Detect their telltale markers so we don't return challenge HTML as job content.
function isChallengePage(text: string): boolean {
  const sample = text.slice(0, 2000).toLowerCase();
  return (
    sample.includes('just a moment') ||
    sample.includes('additional verification required') ||
    sample.includes('attention required') ||
    (sample.includes('ray id') && sample.includes('cloudflare')) ||
    sample.includes('checking your browser')
  );
}

async function fetchViaJina(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain' },
  });

  if (!response.ok) {
    throw new Error(`Jina Reader failed: ${response.status}`);
  }

  const text = (await response.text()).trim();
  if (text.length < 100) {
    throw new Error('Jina Reader returned insufficient content.');
  }
  if (isChallengePage(text)) {
    throw new Error('Target site returned an anti-bot challenge page.');
  }
  return text;
}

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
  if (isChallengePage(text)) {
    throw new Error('Target site returned an anti-bot challenge page.');
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

    // Short-circuit for known anti-bot sites — no scraper reliably bypasses these,
    // so give the user actionable guidance instead of wasting time and returning garbage.
    const blockedHost = isBlockedHost(body.url);
    if (blockedHost) {
      return NextResponse.json(
        { error: new BlockedSiteError(blockedHost).message },
        { status: 422 }
      );
    }

    // Fallback chain: Blotato (if configured) → direct fetch → Jina Reader
    let content: string | undefined;
    const errors: string[] = [];

    if (process.env.BLOTATO_API_KEY) {
      try {
        content = await extractFromUrl(body.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Blotato: ${msg}`);
        console.warn('[POST /api/extract-url] Blotato failed:', msg);
      }
    }

    if (!content) {
      try {
        content = await fetchUrlDirectly(body.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        console.warn('[POST /api/extract-url] Direct fetch failed:', msg);
      }
    }

    if (!content) {
      try {
        content = await fetchViaJina(body.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        console.warn('[POST /api/extract-url] Jina Reader failed:', msg);
      }
    }

    if (!content) {
      throw new Error(errors.join('; '));
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
