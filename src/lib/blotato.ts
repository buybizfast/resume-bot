const BLOTATO_BASE = 'https://backend.blotato.com/v2';

// ──────────────────────────────────────────────
// Low-level helpers
// ──────────────────────────────────────────────

/**
 * Generic resolution creator. Accepts any valid Blotato source object.
 * Returns the resolution ID that can be polled for results.
 */
export async function createResolution(
  source: { sourceType: string; url?: string; text?: string }
): Promise<string> {
  const response = await fetch(`${BLOTATO_BASE}/source-resolutions-v3`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'blotato-api-key': process.env.BLOTATO_API_KEY!,
    },
    body: JSON.stringify({ source }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blotato API error ${response.status}: ${text}`);
  }
  const data = await response.json();
  return data.id;
}

export async function createQuery(query: string): Promise<string> {
  return createResolution({ sourceType: 'perplexity-query', text: query });
}

export async function pollResult(id: string): Promise<{ status: string; result?: any }> {
  const response = await fetch(`${BLOTATO_BASE}/source-resolutions-v3/${id}`, {
    headers: {
      'blotato-api-key': process.env.BLOTATO_API_KEY!,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blotato poll error ${response.status}: ${text}`);
  }
  return response.json();
}

// ──────────────────────────────────────────────
// Poll-and-wait helpers
// ──────────────────────────────────────────────

/**
 * Generic helper: creates a resolution and polls until it completes.
 * Returns the raw result as a string.
 */
async function resolveAndWait(
  source: { sourceType: string; url?: string; text?: string },
  maxPolls = 30,
  intervalMs = 2000
): Promise<string> {
  const id = await createResolution(source);

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const result = await pollResult(id);

    if (result.status === 'completed' || result.status === 'done') {
      // Blotato returns the result in the 'content' field (or sometimes 'result')
      const value = result.result ?? (result as any).content ?? (result as any).output ?? (result as any).text ?? (result as any).data;
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    if (result.status === 'failed' || result.status === 'error') {
      throw new Error(`Blotato resolution failed (sourceType: ${source.sourceType})`);
    }
  }
  throw new Error(`Blotato resolution timed out (sourceType: ${source.sourceType})`);
}

// Helper that creates a query and polls until complete
export async function queryAndWait(query: string, maxPolls = 30, intervalMs = 2000): Promise<string> {
  return resolveAndWait({ sourceType: 'perplexity-query', text: query }, maxPolls, intervalMs);
}

// ──────────────────────────────────────────────
// URL & document extraction
// ──────────────────────────────────────────────

/**
 * Extract content from a web page URL (e.g. a job posting).
 * Uses Blotato's "article" source type.
 */
export async function extractFromUrl(
  url: string,
  maxPolls = 30,
  intervalMs = 2000
): Promise<string> {
  return resolveAndWait({ sourceType: 'article', url }, maxPolls, intervalMs);
}

/**
 * Extract content from a PDF accessible via URL.
 * Uses Blotato's "pdf" source type.
 */
export async function extractFromPdfUrl(
  pdfUrl: string,
  maxPolls = 30,
  intervalMs = 2000
): Promise<string> {
  return resolveAndWait({ sourceType: 'pdf', url: pdfUrl }, maxPolls, intervalMs);
}
