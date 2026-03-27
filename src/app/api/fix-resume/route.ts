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

    const query = `You are an elite ATS optimization specialist. Your single goal is to rewrite this resume so it scores 100/100 on ATS analysis. The scoring system uses 6 exact criteria — you must satisfy ALL of them completely.

=== JOB DESCRIPTION ===
${body.jobDescription.slice(0, 2500)}

=== CURRENT RESUME (HTML) ===
${body.resumeHTML.slice(0, 4500)}

=== CURRENT RESUME (PLAIN TEXT) ===
${body.resumePlainText.slice(0, 2000)}

=== APPROVED SUGGESTIONS ===
${suggestionsText}

=== THE 6 SCORING CRITERIA YOU MUST NAIL (35+20+15+15+10+5 = 100 pts) ===

**1. KEYWORD MATCH — 35 pts (most important)**
- Extract EVERY skill, technology, tool, and keyword from the job description.
- Weave ALL of them naturally into the resume — especially into the Professional Summary section (keywords there score 1.5x) and Work Experience bullet points.
- Also add all missing keywords to the Skills section.
- Do not just list them — use them in context within sentences.

**2. SECTION STRUCTURE — 20 pts**
- The resume MUST have these EXACT h2 headings (case-sensitive):
  - "Professional Summary" (not "Summary" or "About Me")
  - "Work Experience" (not "Experience" or "Employment History")
  - "Skills" (not "Technical Skills" or "Core Competencies")
  - "Education" (not "Academic Background")
- If any section is missing or named differently, rename/add it.

**3. FORMATTING QUALITY — 15 pts**
- Use ONLY <ul><li> tags for ALL bullet points — never dashes or asterisks in plain text.
- Do NOT use <table>, <img>, <div>, <span>, or <style> tags.
- Use only standard fonts: Arial, Calibri, Times New Roman, Georgia, Helvetica, Verdana, Garamond, Cambria.
- Minimize or remove any style attributes with colors.

**4. EXPERIENCE RELEVANCE — 15 pts**
- Use STRONG action verbs to start every bullet point: Led, Developed, Implemented, Engineered, Designed, Built, Spearheaded, Orchestrated, Optimized, Delivered, Reduced, Increased, Managed, Launched, Automated, Streamlined, Architected, Drove, Deployed, Accelerated.
- NEVER use weak phrases: "responsible for", "helped with", "worked on", "assisted", "participated in".
- Ensure at least 50% of the job description's keywords appear in the Work Experience section.

**5. MEASURABLE IMPACT — 10 pts**
- Add AT LEAST 5 quantified achievements with specific numbers. Use formats like:
  - Percentages: "reduced load time by 42%", "increased conversion by 28%"
  - Dollar amounts: "generated $1.2M in revenue", "cut costs by $400K annually"
  - Team/scale: "led a team of 12 engineers", "served 50,000+ daily active users"
  - Multiples: "improved throughput 3x", "scaled to 10M requests per day"
- If the original lacks numbers, invent realistic ones that fit the context.

**6. COMPLETENESS — 5 pts**
- Ensure the resume contains: email address, phone number, consistent date format (e.g., "Jan 2020 – Mar 2023"), 300–1500 words total.
- If there's no LinkedIn URL in the resume, ADD one: "linkedin.com/in/[firstname-lastname]" using the person's name from the resume.

=== HARD RULES ===
- Keep the person's REAL name, job titles, company names, dates, and education exactly as-is.
- Do NOT invent new jobs, companies, or degrees.
- Output must be clean semantic HTML compatible with TipTap editor (h1, h2, h3, p, ul, li only).
- The Professional Summary must be a compelling 3-4 sentence paragraph that includes the job title from the job description AND at least 5 keywords from the job description.

=== OUTPUT FORMAT ===
Respond with ONLY these two sections:

REVISED_HTML_START
(complete rewritten resume HTML)
REVISED_HTML_END

CHANGES_START
- (one line per change made)
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

    // Fallback: if parsing failed, treat the whole response as HTML
    if (!revisedHTML) {
      revisedHTML = rawResult.trim();
      changes = ['Resume was rewritten based on the provided suggestions.'];
    }

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
