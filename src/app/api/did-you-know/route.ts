import { NextRequest, NextResponse } from 'next/server';
import { queryAndWait } from '@/lib/blotato';
import { stripMarkdown } from '@/lib/text-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.jobTitle || typeof body.jobTitle !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "jobTitle" field.' },
        { status: 400 }
      );
    }

    if (!body.careerField || typeof body.careerField !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "careerField" field.' },
        { status: 400 }
      );
    }

    if (!process.env.BLOTATO_API_KEY) {
      return NextResponse.json(
        { error: 'Blotato API key is not configured.' },
        { status: 500 }
      );
    }

    const resumeContext = body.resumeSnippet
      ? `\n\nHere is a summary of their current resume:\n${body.resumeSnippet}\n\nLook at what's on the resume and identify what AI/automation skills are MISSING. Focus your recommendations on filling those gaps.`
      : '';

    const query = `You are a career coach who helps people stand out by adding AI and automation skills to their resume.

The user is a ${body.careerField} professional applying for a "${body.jobTitle}" role.${resumeContext}

Give exactly 5 specific, hands-on AI projects or workflows they can actually BUILD and add to their resume. Each must be:
- Something they can do in a weekend using no-code/low-code or AI coding tools
- Directly relevant to ${body.careerField} (not generic)
- Using specific tools (Make.com, Zapier, Claude, ChatGPT API, Cursor, Claude Code, n8n, Midjourney, Streamlit, etc.)

For each of the 5, respond in this EXACT format (use these exact labels):

**Tool:** [tool name]
**Project:** [what to build in one sentence]
**Resume Bullet:** [how to word it on a resume]
**Why:** [one sentence why recruiters care]

Example:
**Tool:** Make.com + ChatGPT API
**Project:** Build an automated content calendar that generates and schedules social media posts
**Resume Bullet:** Designed and deployed AI-powered content automation pipeline, reducing content production time by 60%
**Why:** Shows you can automate repetitive workflows and think systematically about efficiency

Be extremely specific to ${body.careerField}. No generic "use ChatGPT to write emails" stuff.`;

    const rawResult = await queryAndWait(query);

    const recommendations = parseRecommendations(rawResult);

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching AI recommendations';
    console.error('[POST /api/did-you-know]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface Recommendation {
  tool: string;
  project: string;
  resumeBullet: string;
  whyItStandsOut: string;
}

function parseRecommendations(raw: string): Recommendation[] {
  if (!raw) return [];

  const recommendations: Recommendation[] = [];

  // Strategy 1: Look for **Tool:**/**Project:**/**Resume Bullet:** pattern
  const toolPattern = /\*{0,2}Tool:?\*{0,2}\s*(.+?)(?:\n|$)/gi;
  const projectPattern = /\*{0,2}Project:?\*{0,2}\s*(.+?)(?:\n|$)/gi;
  const bulletPattern = /\*{0,2}Resume\s*Bullet:?\*{0,2}\s*(.+?)(?:\n|$)/gi;
  const whyPattern = /\*{0,2}(?:Why(?:\s*(?:It\s*Stands?\s*Out)?)?|Standout|Impact):?\*{0,2}\s*(.+?)(?:\n|$)/gi;

  const tools = [...raw.matchAll(toolPattern)].map(m => m[1].trim());
  const projects = [...raw.matchAll(projectPattern)].map(m => m[1].trim());
  const bullets = [...raw.matchAll(bulletPattern)].map(m => m[1].trim());
  const whys = [...raw.matchAll(whyPattern)].map(m => m[1].trim());

  if (tools.length > 0 && projects.length > 0) {
    const count = Math.min(tools.length, projects.length, 5);
    for (let i = 0; i < count; i++) {
      recommendations.push({
        tool: cleanField(tools[i] || ''),
        project: cleanField(projects[i] || ''),
        resumeBullet: cleanField(bullets[i] || ''),
        whyItStandsOut: cleanField(whys[i] || ''),
      });
    }
    return recommendations;
  }

  // Strategy 2: Split by numbered sections (1. / 2. / etc) or ### headers
  const sections = raw.split(/(?=(?:^|\n)(?:\d+[\.\)]\s|\#{1,3}\s))/m).filter(s => s.trim().length > 20);

  if (sections.length >= 3) {
    for (const section of sections.slice(0, 5)) {
      const toolMatch = section.match(/(?:\*{0,2}Tool:?\*{0,2}|Using|with)\s*[:\-]?\s*(.+?)(?:\n|$)/i);
      const projectMatch = section.match(/(?:\*{0,2}Project:?\*{0,2})\s*[:\-]?\s*(.+?)(?:\n|$)/i);
      const bulletMatch = section.match(/(?:\*{0,2}Resume\s*Bullet:?\*{0,2})\s*[:\-]?\s*(.+?)(?:\n|$)/i);
      const whyMatch = section.match(/(?:\*{0,2}Why:?\*{0,2})\s*[:\-]?\s*(.+?)(?:\n|$)/i);

      // Extract the first meaningful line as a fallback project description
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      const firstLine = lines[0]?.replace(/^\d+[\.\)]\s*/, '').replace(/^#{1,3}\s*/, '').replace(/^\*+/, '').trim() || '';

      const tool = toolMatch ? cleanField(toolMatch[1]) : '';
      const project = projectMatch ? cleanField(projectMatch[1]) : firstLine;
      const bullet = bulletMatch ? cleanField(bulletMatch[1]) : '';
      const why = whyMatch ? cleanField(whyMatch[1]) : '';

      if (project) {
        recommendations.push({
          tool,
          project,
          resumeBullet: bullet,
          whyItStandsOut: why,
        });
      }
    }
    if (recommendations.length > 0) return recommendations;
  }

  // Strategy 3: Last resort — split into meaningful paragraphs/lines
  // Filter out preamble/analysis text that talks about the resume rather than recommending projects
  const preamblePatterns = /^(here|as a|the resume|your resume|looking at|based on|i notice|currently|the current|overall|this resume|the summary|the bullet|note:|important:|analysis:|assessment:)/i;
  const lines = raw
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').replace(/^\*+/, '').trim())
    .filter(l => l.length > 20 && !preamblePatterns.test(l));

  for (const line of lines.slice(0, 5)) {
    // Try to extract a tool name from the line
    const toolInLine = line.match(/(?:using|with|via)\s+(\w[\w\s\.\+]*?)(?:\s+(?:to|for|and|,)|$)/i);
    recommendations.push({
      tool: toolInLine ? cleanField(toolInLine[1]) : '',
      project: cleanField(line),
      resumeBullet: '',
      whyItStandsOut: '',
    });
  }

  return recommendations.slice(0, 5);
}

function cleanField(s: string): string {
  return stripMarkdown(
    s
      .replace(/^\*+|\*+$/g, '')
      .replace(/^[""\u201c]|[""\u201d]$/g, '')
      .replace(/^[:\-]\s*/, '')
      .trim()
  );
}
