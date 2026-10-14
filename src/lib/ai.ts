import Anthropic from '@anthropic-ai/sdk';

// Sonnet for anything customers pay for (resume rewrites, cover letters,
// scam research); Haiku for cheap, high-volume content like Did-You-Know cards.
export const MODELS = {
  writing: 'claude-sonnet-5-5',
  light: 'claude-haiku-5-5',
} as const;

type Model = (typeof MODELS)[keyof typeof MODELS];
type Effort = 'low' | 'medium' | 'high';

export const AI_NOT_CONFIGURED_ERROR = 'AI service is not configured (missing ANTHROPIC_API_KEY).';

/** Thrown when a web-search request finished but no search returned results. */
export class WebSearchUnavailableError extends Error {
  constructor() {
    super('Live web research is temporarily unavailable. Please try again in a minute.');
  }
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

interface GenerateOptions {
  model?: Model;
  effort?: Effort;
  maxTokens?: number;
}

interface RunResult {
  text: string;
  /** Searches that returned at least one result. */
  searchesWithResults: number;
  searchErrors: string[];
}

const MAX_CONTINUATIONS = 3;

async function runPrompt(
  prompt: string,
  opts: GenerateOptions & { webSearchMaxUses?: number }
): Promise<RunResult> {
  const model = opts.model ?? MODELS.writing;
  const tools: Anthropic.Beta.BetaToolUnion[] | undefined = opts.webSearchMaxUses
    ? [{ type: 'web_search_20260209', name: 'web_search', max_uses: opts.webSearchMaxUses }]
    : undefined;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: prompt }];
  const content: Anthropic.Beta.BetaContentBlock[] = [];
  let response: Anthropic.Beta.BetaMessage | undefined;

  try {
    // Server-side web search can pause a long turn; resend to let it resume.
    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      response = await getClient().beta.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 16000,
        output_config: { effort: opts.effort ?? 'medium' },
        messages,
        ...(tools ? { tools } : {}),
        // Re-run a safety-declined request on Anthropic's recommended fallback model.
        // Server-side fallbacks aren't available for Haiku.
        ...(model === MODELS.writing
          ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
          : {}),
      });
      content.push(...response.content);
      if (response.stop_reason !== 'pause_turn') break;
      messages.splice(1, messages.length - 1, { role: 'assistant', content: response.content });
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('AI service authentication failed — check ANTHROPIC_API_KEY.');
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('The AI service is busy right now. Please try again in a minute.');
    }
    if (err instanceof Anthropic.APIError) {
      // 400s here include "credit balance too low" — log the detail, keep the user message generic.
      console.error('[ai] Anthropic API error', err.status, err.message);
      throw new Error('The AI service is temporarily unavailable. Please try again shortly.');
    }
    throw err;
  }

  if (!response || response.stop_reason === 'refusal') {
    throw new Error('The AI was unable to complete this request. Please try again.');
  }

  let searchesWithResults = 0;
  const searchErrors: string[] = [];
  for (const block of content) {
    if (block.type !== 'web_search_tool_result') continue;
    // Success is a list of results; failure is a single error object.
    if (Array.isArray(block.content)) {
      if (block.content.length > 0) searchesWithResults++;
    } else {
      searchErrors.push(block.content.error_code);
    }
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  if (!text) throw new Error('The AI returned an empty response. Please try again.');
  return { text, searchesWithResults, searchErrors };
}

/**
 * Send a single prompt to Claude and return the text of its answer.
 * Throws an Error with a user-safe message on failure.
 */
export async function generateText(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  return (await runPrompt(prompt, opts)).text;
}

/**
 * Like generateText, but Claude researches on the live web (billed per search).
 * Retries once if no search returns results, then throws WebSearchUnavailableError
 * rather than returning an answer written from the model's memory.
 */
export async function generateWithWebSearch(
  prompt: string,
  opts: GenerateOptions & { maxSearches: number }
): Promise<string> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await runPrompt(prompt, { ...opts, webSearchMaxUses: opts.maxSearches });
    if (result.searchErrors.length > 0) {
      console.warn(`[ai] web search errors (attempt ${attempt}):`, result.searchErrors.join(', '));
    }
    if (result.searchesWithResults > 0) return result.text;
  }
  throw new WebSearchUnavailableError();
}
