import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';
import { stripMarkdown } from '@/lib/text-utils';

export async function POST(request: NextRequest) {
  try {
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

    const query = `You are an expert resume writer and ATS optimization specialist. Your task is to rewrite a resume in HTML format, applying specific improvements.

=== JOB DESCRIPTION ===
${body.jobDescription.slice(0, 2000)}

=== CURRENT RESUME (HTML) ===
${body.resumeHTML.slice(0, 4000)}

=== CURRENT RESUME (PLAIN TEXT for reference) ===
${body.resumePlainText.slice(0, 2000)}

=== APPROVED SUGGESTIONS TO APPLY ===
${suggestionsText}

=== INSTRUCTIONS ===
Rewrite the resume HTML by applying ALL of the approved suggestions above. Follow these rules strictly:

1. ADD MISSING KEYWORDS: Naturally weave any missing skills, technologies, or keywords from the job description into experience bullet points and the skills section. Do not simply list them - integrate them into context.

2. STRONG ACTION VERBS: Replace weak or passive verbs (e.g., "responsible for", "helped", "worked on") with strong action verbs (e.g., "Led", "Developed", "Implemented", "Orchestrated", "Spearheaded", "Engineered", "Optimized").

3. QUANTIFIED ACHIEVEMENTS: Where bullet points lack measurable results, add realistic quantified achievements with numbers, percentages, dollar amounts, or timeframes (e.g., "Reduced load time by 40%", "Managed a team of 8 engineers", "Increased revenue by $2M annually").

4. MAINTAIN HTML STRUCTURE: Keep the same HTML element types (h1, h2, h3, p, ul, li, etc.). Do not introduce new HTML tags like <div>, <span>, <table>, or <style>. The output must be clean semantic HTML compatible with a TipTap rich text editor.

5. PRESERVE IDENTITY: Keep the person's real name, job titles, company names, dates, education, and certifications exactly as they are. Only enhance the descriptive content.

6. DO NOT FABRICATE: Do not invent new jobs, companies, degrees, or experiences. Only improve and enhance what already exists.

=== OUTPUT FORMAT ===
Respond with ONLY two sections, clearly separated:

REVISED_HTML_START
(the complete rewritten resume HTML here)
REVISED_HTML_END

CHANGES_START
- (bullet point summary of each change made)
- (one line per change)
CHANGES_END

Do not include any other text, explanation, or commentary outside these sections.`;

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

    return NextResponse.json({ revisedHTML, changes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fixing resume';
    console.error('[POST /api/fix-resume]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
