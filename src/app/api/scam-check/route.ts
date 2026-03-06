import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';

interface LocalAnalysis {
  redFlags: string[];
  riskScore: number;
}

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'icloud.com',
];

const PAYMENT_KEYWORDS = [
  'pay', 'fee', 'deposit', 'wire transfer', 'money order', 'western union',
  'gift card', 'prepaid card', 'bitcoin', 'cryptocurrency', 'upfront cost',
  'processing fee', 'registration fee', 'training fee',
];

const URGENCY_KEYWORDS = [
  'act now', 'limited time', 'immediate hire', 'urgent', 'don\'t miss',
  'expires soon', 'today only', 'right away', 'immediately available',
  'respond immediately', 'asap',
];

const TOO_GOOD_PATTERNS = [
  /\$\d{2,3},?\d{3}\s*per\s*month/i,
  /\$\d{4,}\s*per\s*(week|day)/i,
  /no\s*experience\s*(needed|required|necessary)/i,
  /work\s*from\s*home.*\$\d{3,}/i,
  /guaranteed\s*(income|salary|earnings)/i,
  /unlimited\s*(earning|income)/i,
  /make\s*\$\d{4,}\s*(a|per)\s*(week|day)/i,
];

function analyzeJobText(jobText: string): LocalAnalysis {
  const redFlags: string[] = [];
  const lowerText = jobText.toLowerCase();

  // Check for free email domains in the text
  for (const domain of FREE_EMAIL_DOMAINS) {
    if (lowerText.includes(domain)) {
      redFlags.push(`Uses free email domain (${domain}) instead of a company email address.`);
      break; // Only flag once for email domains
    }
  }

  // Check for payment requests
  const foundPaymentKeywords: string[] = [];
  for (const keyword of PAYMENT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundPaymentKeywords.push(keyword);
    }
  }
  if (foundPaymentKeywords.length > 0) {
    redFlags.push(`Contains payment-related language: ${foundPaymentKeywords.join(', ')}. Legitimate employers do not ask candidates to pay fees.`);
  }

  // Check for urgency language
  const foundUrgencyKeywords: string[] = [];
  for (const keyword of URGENCY_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundUrgencyKeywords.push(keyword);
    }
  }
  if (foundUrgencyKeywords.length > 0) {
    redFlags.push(`Uses high-pressure urgency language: ${foundUrgencyKeywords.join(', ')}.`);
  }

  // Check for too-good-to-be-true patterns
  for (const pattern of TOO_GOOD_PATTERNS) {
    if (pattern.test(jobText)) {
      redFlags.push('Contains potentially unrealistic salary or benefit claims.');
      break;
    }
  }

  // Check for vague descriptions
  const hasSpecificRequirements =
    lowerText.includes('years of experience') ||
    lowerText.includes('bachelor') ||
    lowerText.includes('master') ||
    lowerText.includes('degree') ||
    lowerText.includes('certification') ||
    lowerText.includes('proficient in') ||
    lowerText.includes('experience with') ||
    lowerText.includes('knowledge of') ||
    lowerText.includes('skills in');

  if (!hasSpecificRequirements && jobText.length > 100) {
    redFlags.push('Job description lacks specific requirements, qualifications, or skills -- a common trait of scam postings.');
  }

  // Calculate risk score: 0 = safe, 100 = very risky
  const maxFlags = 5;
  const riskScore = Math.min(100, Math.round((redFlags.length / maxFlags) * 100));

  return { redFlags, riskScore };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "companyName" field. Expected a non-empty string.' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    // Run local heuristics on job text if provided
    let localAnalysis: LocalAnalysis = { redFlags: [], riskScore: 0 };
    if (body.jobText && typeof body.jobText === 'string' && body.jobText.trim().length > 0) {
      localAnalysis = analyzeJobText(body.jobText);
    }

    // Build the Perplexity query for online verification
    let queryParts = `Is ${body.companyName} a legitimate employer?`;
    if (body.jobTitle && typeof body.jobTitle === 'string') {
      queryParts += ` They are advertising a ${body.jobTitle} position.`;
    }
    if (body.jobUrl && typeof body.jobUrl === 'string') {
      queryParts += ` Job posting URL: ${body.jobUrl}.`;
    }

    const query = `${queryParts} Research the following: 1) Does the company have a BBB profile? What rating? 2) Does it have a Glassdoor presence with employee reviews? 3) Does it have a verified LinkedIn company page? 4) Are there any reported scam complaints about this company? 5) How old is the company's website domain? 6) Are there legitimate news articles about this company? Provide a factual assessment of the company's legitimacy with sources.`;

    const aiAnalysis = await queryAndWait(query);

    return NextResponse.json({ localAnalysis, aiAnalysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during scam check';
    console.error('[POST /api/scam-check]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
