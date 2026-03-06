import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';

export async function POST(request: NextRequest) {
  try {
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

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const summarizedJD = body.jobDescription.slice(0, 2000);
    const summarizedResume = body.resumeText.slice(0, 2000);

    const query = `Given this job description: ${summarizedJD}. And this resume: ${summarizedResume}. Provide exactly 5 specific, actionable suggestions to optimize this resume for ATS systems and this specific role. For each suggestion, provide: 1) What to change 2) Why it matters 3) Example text to add. Focus on missing keywords, weak bullet points, and opportunities to quantify achievements. Format as a numbered list.`;

    const suggestions = await queryAndWait(query);

    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during resume optimization';
    console.error('[POST /api/optimize]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
