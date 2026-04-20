import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';
import { stripMarkdown } from '@/lib/text-utils';
import { verifyAuth, requireCredits, deductCredit, handleAuthError, AuthError } from '@/lib/auth-helpers';

// ─── IP Rate Limiter (1 free anonymous fix per IP per 24h) ───────────────────
const ANON_LIMIT = 1;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface IpRecord { count: number; resetAt: number }
const ipMap = new Map<string, IpRecord>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkIpLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now > record.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: ANON_LIMIT - 1 };
  }

  if (record.count >= ANON_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: ANON_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  try {
    // ─── Auth + Credit Check (auth optional — anonymous users get 1 free fix) ───
    let uid: string | null = null;
    let fixType: 'free' | 'paid' | 'anonymous' = 'anonymous';
    try {
      const authResult = await verifyAuth(request);
      uid = authResult.uid;
      const creditCheck = await requireCredits(uid);
      if (!creditCheck.canFix) {
        return NextResponse.json(
          { error: 'No fixes remaining', requiresPayment: true },
          { status: 402 }
        );
      }
      fixType = creditCheck.fixType as 'free' | 'paid';
    } catch {
      // No auth token — check IP rate limit before allowing free fix
      const ip = getClientIp(request);
      const { allowed } = checkIpLimit(ip);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Free fix limit reached. Sign in to get more fixes.', requiresSignIn: true },
          { status: 429 }
        );
      }
      uid = null;
      fixType = 'anonymous';
    }

    const body = await request.json();

    if (!body.resumeHTML || typeof body.resumeHTML !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "resumeHTML" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!body.resumePlainText || typeof body.resumePlainText !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "resumePlainText" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!body.jobDescription || typeof body.jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "jobDescription" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.suggestions) || body.suggestions.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "suggestions" field. Expected a non-empty array of strings.' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const suggestionsText = body.suggestions
      .map((s: string, i: number) => `${i + 1}. ${s}`)
      .join('\n');

    // Extract the plain text to use as the source of truth for locked identity fields
    const plainText: string = body.resumePlainText.slice(0, 2000);

    const query = `You are an elite ATS optimization specialist. Rewrite this resume to maximize ATS compatibility and keyword alignment for the job description below, while keeping ALL original personal information 100% intact.

=== JOB DESCRIPTION ===
${body.jobDescription.slice(0, 2500)}

=== CURRENT RESUME (HTML — rewrite this) ===
${body.resumeHTML.slice(0, 4500)}

=== CURRENT RESUME (PLAIN TEXT — source of truth for identity fields) ===
${plainText}

=== APPROVED SUGGESTIONS ===
${suggestionsText}

=== IDENTITY — COPY THESE EXACTLY, WORD FOR WORD, DO NOT ALTER ===
The plain text above contains the real information. You MUST copy every one of these fields exactly as they appear — do not paraphrase, do not update, do not correct, do not reorder:
- Full name
- Email address
- Phone number
- Location/city
- Every job title, company name, and employment date range
- Every university/school name, degree title, major, and graduation year
- Every certification, award, or license name and date

Changing ANY of the above is a critical failure. Copy them character-for-character.

=== 6 OPTIMIZATION CRITERIA ===

1. KEYWORD MATCH (highest priority): Extract EVERY skill, technology, and keyword from the job description. Weave ALL of them into the Professional Summary (1.5x weight) and Work Experience bullets. Add all to Skills section too. Do not just list — integrate into sentences.

2. SECTION STRUCTURE: Use EXACTLY these h2 headings:
   "Professional Summary" | "Work Experience" | "Skills" | "Education"
   Rename any non-standard headings to match these exactly.

3. FORMATTING QUALITY: Use <ul><li> for ALL bullets. No <table>, <img>, <div>, <span>, <style> tags. No inline color styles. No markdown asterisks (**bold** or *italic*) — use plain text only inside HTML tags.

4. EXPERIENCE RELEVANCE: Start every bullet with a strong action verb: Led, Developed, Implemented, Engineered, Designed, Built, Spearheaded, Orchestrated, Optimized, Delivered, Reduced, Increased, Managed, Launched, Automated, Streamlined, Architected, Drove, Deployed, Accelerated. Never use: "responsible for", "helped", "worked on", "assisted", "participated".

5. MEASURABLE IMPACT: Add AT LEAST 5 quantified results with specific numbers — percentages, dollar amounts, team sizes, or multiples. If original lacks numbers, add realistic ones that fit the role.

6. COMPLETENESS: Keep email, phone, consistent date format (e.g. "Jan 2020 - Mar 2023"), 300-1500 words. If no LinkedIn URL exists, add: "linkedin.com/in/[firstname-lastname]".

=== ABSOLUTE OUTPUT RULES ===
- Pure HTML only — no markdown, no **, no *, no __, no backticks anywhere in the output
- Only use tags: h1, h2, h3, p, ul, li, a, br
- Professional Summary: 3-4 sentences, includes job title from JD and 5+ JD keywords
- Do NOT invent new jobs, companies, degrees, or certifications

=== OUTPUT FORMAT ===
Respond with ONLY:

REVISED_HTML_START
(complete rewritten resume HTML — no markdown)
REVISED_HTML_END

CHANGES_START
- (one line per change, plain text only)
CHANGES_END`;

    const rawResult = await queryAndWait(query, 60, 3000);

    // Parse the structured response
    let revisedHTML = '';
    let changes: string[] = [];

    const htmlMatch = rawResult.match(
      /REVISED_HTML_START\s*([\s\S]*?)\s*REVISED_HTML_END/
    );
    if (htmlMatch && htmlMatch[1]) {
      revisedHTML = htmlMatch[1].trim();
    }

    const changesMatch = rawResult.match(
      /CHANGES_START\s*([\s\S]*?)\s*CHANGES_END/
    );
    if (changesMatch && changesMatch[1]) {
      changes = changesMatch[1]
        .split('\n')
        .map((line: string) => stripMarkdown(line.replace(/^[-*]\s*/, '').trim()))
        .filter((line: string) => line.length > 0);
    }

    // If parsing failed, validate the raw response actually looks like HTML before using it
    if (!revisedHTML) {
      const trimmed = rawResult.trim();
      const looksLikeHTML = trimmed.includes('<h1') || trimmed.includes('<h2') || trimmed.includes('<p>') || trimmed.includes('<ul');
      if (!looksLikeHTML) {
        console.error('[POST /api/fix-resume] AI returned non-HTML response:', trimmed.slice(0, 300));
        return NextResponse.json(
          { error: 'The AI was unable to rewrite your resume this time. Please try again.' },
          { status: 500 }
        );
      }
      revisedHTML = trimmed;
      changes = ['Resume was rewritten based on the provided suggestions.'];
    }

    // Strip any markdown asterisks the AI slipped into the HTML
    // **bold** → bold, *italic* → italic
    revisedHTML = revisedHTML
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1');

    // ─── Deduct credit on success (skip for anonymous users) ───
    if (uid && fixType !== 'anonymous') {
      try {
        await deductCredit(uid, fixType as 'free' | 'paid', body.resumeTitle || 'Untitled');
      } catch (creditErr) {
        // Log but don't fail — user already got their fix
        console.error('[POST /api/fix-resume] Failed to deduct credit:', creditErr);
      }
    }

    return NextResponse.json({ revisedHTML, changes });
  } catch (err) {
    if (err instanceof AuthError) return handleAuthError(err);
    const message = err instanceof Error ? err.message : 'Unknown error fixing resume';
    console.error('[POST /api/fix-resume]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
