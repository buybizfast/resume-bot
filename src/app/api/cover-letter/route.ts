import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';
import { verifyAuth, requireCredits, deductCredit, handleAuthError, AuthError } from '@/lib/auth-helpers';

const VALID_TONES = ['professional', 'conversational'] as const;
type Tone = (typeof VALID_TONES)[number];

function isValidTone(value: unknown): value is Tone {
  return typeof value === 'string' && VALID_TONES.includes(value as Tone);
}

export async function POST(request: NextRequest) {
  try {
    // ─── Auth + Credit Check ───
    let uid: string;
    let fixType: 'free' | 'paid';
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
    } catch (error) {
      return handleAuthError(error);
    }

    const body = await request.json();

    if (!body.resumeText || typeof body.resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "resumeText" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!body.jobDescription || typeof body.jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "jobDescription" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "companyName" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!isValidTone(body.tone)) {
      return NextResponse.json(
        { error: 'Missing or invalid "tone" field. Expected "professional" or "conversational".' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const summarizedJD = body.jobDescription.slice(0, 1500);
    const summarizedResume = body.resumeText.slice(0, 1500);

    const query = `Write a compelling cover letter for the following job. Job description: ${summarizedJD}. Candidate qualifications from resume: ${summarizedResume}. Company: ${body.companyName}. Tone: ${body.tone}. Requirements: 3-4 paragraphs, under 400 words, specific to this role and company, highlight relevant experience, show enthusiasm. Do NOT use generic phrases like 'I am writing to express my interest'. Start with a compelling hook.`;

    const coverLetter = await queryAndWait(query);

    // ─── Deduct credit on success ───
    try {
      await deductCredit(uid, fixType, 'Cover Letter');
    } catch (creditErr) {
      console.error('[POST /api/cover-letter] Failed to deduct credit:', creditErr);
    }

    return NextResponse.json({ coverLetter });
  } catch (err) {
    if (err instanceof AuthError) return handleAuthError(err);
    const message = err instanceof Error ? err.message : 'Unknown error generating cover letter';
    console.error('[POST /api/cover-letter]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
