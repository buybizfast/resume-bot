import { NextRequest, NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

function wrapInDocumentStructure(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 20pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 4pt;
    color: #000000;
  }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    border-bottom: 1px solid #000000;
    padding-bottom: 2pt;
    margin-top: 12pt;
    margin-bottom: 6pt;
    color: #000000;
    text-transform: uppercase;
  }
  h3 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 8pt;
    margin-bottom: 2pt;
    color: #000000;
  }
  p { margin: 4pt 0; }
  ul { margin: 2pt 0 8pt 0; padding-left: 18pt; }
  li { margin-bottom: 2pt; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    const wrappedHtml = wrapInDocumentStructure(html);

    const blob = await HTMLtoDOCX(wrappedHtml, null, {
      margin: {
        top: 720,
        right: 720,
        bottom: 720,
        left: 720,
      },
      header: false,
      footer: false,
      font: 'Calibri',
      fontSize: 22,
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="resume.docx"',
      },
    });
  } catch (error) {
    console.error('[export-docx] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
