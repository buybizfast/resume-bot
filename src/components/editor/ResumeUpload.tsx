'use client';

import { useState, useRef, useCallback } from 'react';

interface ResumeUploadProps {
  onResumeExtracted: (html: string, plainText: string) => void;
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.doc,.txt';

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

/** Read a File as ArrayBuffer using FileReader (works on all Safari versions including mobile) */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Read a File as text using FileReader (works on all Safari versions including mobile) */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function wrapTextInHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return `<p>${lines.join('<br>')}</p>`;
    })
    .filter((p) => p !== '<p></p>');

  return paragraphs.join('\n');
}

// ─── PDF Extraction with structure preservation ───

interface PdfTextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, translateX, translateY]
  fontName: string;
  height: number;
  width: number;
}

interface ReconstructedLine {
  text: string;
  fontSize: number;
  y: number;
  x: number;
  isBullet: boolean;
  fontName: string;
}

/** Known resume section headings — used to identify headings by content even at similar font sizes */
const SECTION_HEADING_PATTERNS = /^(summary|professional\s+summary|executive\s+summary|career\s+summary|objective|career\s+objective|profile|professional\s+profile|overview|about(\s+me)?|experience|work\s+experience|professional\s+experience|employment(\s+history)?|work\s+history|career\s+history|education|academic|qualifications|skills|technical\s+skills|core\s+competencies|key\s+skills|areas\s+of\s+expertise|certifications?|certificates?|licenses?|projects?|portfolio|awards?|honors?|achievements?|publications?|volunteer|languages?|references?|interests?|activities?)$/i;

const BULLET_CHARS = /^[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1\u2013\u2014●○■□▪▫◆◇►▸‣⁃–—•·∙→⮕➤\-]/;

function reconstructLines(items: PdfTextItem[]): ReconstructedLine[] {
  if (items.length === 0) return [];

  // Sort items by Y position (top to bottom — PDF Y is bottom-up, so higher Y = higher on page)
  // Then by X position (left to right)
  const sorted = [...items]
    .filter((item) => item.str.trim().length > 0 || item.str === ' ')
    .sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      // If Y difference is more than ~40% of font height, they're different lines
      const threshold = Math.min(a.height, b.height) * 0.4;
      if (Math.abs(yA - yB) > threshold) return yB - yA; // higher Y = earlier (top of page)
      return a.transform[4] - b.transform[4]; // left to right
    });

  const lines: ReconstructedLine[] = [];
  let currentLine: PdfTextItem[] = [];
  let currentY = sorted[0].transform[5];

  for (const item of sorted) {
    const itemY = item.transform[5];
    const threshold = Math.min(item.height, currentLine[0]?.height ?? item.height) * 0.4;

    if (currentLine.length === 0 || Math.abs(currentY - itemY) <= threshold) {
      // Same line
      currentLine.push(item);
    } else {
      // New line — flush the current one
      if (currentLine.length > 0) {
        lines.push(buildLine(currentLine));
      }
      currentLine = [item];
      currentY = itemY;
    }
  }
  // Flush last line
  if (currentLine.length > 0) {
    lines.push(buildLine(currentLine));
  }

  return lines;
}

function buildLine(items: PdfTextItem[]): ReconstructedLine {
  // Sort by X position to ensure correct reading order
  items.sort((a, b) => a.transform[4] - b.transform[4]);

  // Join text items, adding spaces between items that aren't adjacent
  let text = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const prevItem = items[i - 1];
      const prevEnd = prevItem.transform[4] + prevItem.width;
      const gap = item.transform[4] - prevEnd;
      // If there's a meaningful gap between items, add a space
      const spaceWidth = item.height * 0.25;
      if (gap > spaceWidth && !text.endsWith(' ') && !item.str.startsWith(' ')) {
        text += ' ';
      }
    }
    text += item.str;
  }

  // Use the most common (or largest) font size in the line
  const fontSize = Math.max(...items.map((i) => i.height));
  const firstItem = items[0];

  // Check if line starts with a bullet character
  const trimmed = text.trim();
  const isBullet = BULLET_CHARS.test(trimmed);

  return {
    text: text.trim(),
    fontSize,
    y: firstItem.transform[5],
    x: firstItem.transform[4],
    isBullet,
    fontName: firstItem.fontName,
  };
}

function classifyLines(lines: ReconstructedLine[]): ReconstructedLine[] {
  // We don't mutate, just return — classification is done in the HTML builder
  return lines;
}

/**
 * Determine the "body" font size — the most common font size in the document.
 * Anything significantly larger than body is likely a heading.
 */
function getBodyFontSize(lines: ReconstructedLine[]): number {
  const sizeCounts = new Map<number, number>();
  for (const line of lines) {
    if (line.text.length < 3) continue; // skip tiny fragments
    const rounded = Math.round(line.fontSize * 2) / 2; // round to nearest 0.5
    sizeCounts.set(rounded, (sizeCounts.get(rounded) || 0) + line.text.length);
  }

  let maxCount = 0;
  let bodySize = 10;
  for (const [size, count] of sizeCounts) {
    if (count > maxCount) {
      maxCount = count;
      bodySize = size;
    }
  }
  return bodySize;
}

/**
 * Build structured HTML from classified lines.
 */
function buildHtmlFromLines(lines: ReconstructedLine[]): string {
  if (lines.length === 0) return '';

  const bodyFontSize = getBodyFontSize(lines);
  const headingThreshold = bodyFontSize * 1.15; // 15% larger than body = heading
  const nameThreshold = bodyFontSize * 1.5; // 50% larger = name/title (h1)

  const htmlParts: string[] = [];
  let inBulletList = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const text = line.text;

    // Skip empty lines
    if (!text) {
      i++;
      continue;
    }

    const isAllCaps = text === text.toUpperCase() && text.length > 2 && /[A-Z]/.test(text);
    const isLargeFont = line.fontSize >= headingThreshold;
    const isVeryLarge = line.fontSize >= nameThreshold;
    const matchesSectionPattern = SECTION_HEADING_PATTERNS.test(text.trim());

    // Determine if this is a heading
    // Priority: section pattern match (e.g. "SUMMARY", "PROFESSIONAL EXPERIENCE") always wins
    // ALL CAPS with slightly larger font = heading. Large font short lines = heading.
    // ALL CAPS matching known section names = heading regardless of font size.
    const isHeading = matchesSectionPattern ||
      (isAllCaps && isLargeFont) ||
      (isLargeFont && text.length < 60);
    const isName = isVeryLarge && i < 5; // Name is usually in the first few lines

    // Close bullet list if we're leaving bullet territory
    if (inBulletList && !line.isBullet) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }

    if (isName && i < 3) {
      // Person's name — h1
      htmlParts.push(`<h1>${escapeHtml(text)}</h1>`);
    } else if (isHeading) {
      // Section heading — h2
      htmlParts.push(`<h2>${escapeHtml(text)}</h2>`);
    } else if (line.isBullet) {
      // Bullet point
      const bulletText = text.replace(BULLET_CHARS, '').trim();
      if (!inBulletList) {
        htmlParts.push('<ul>');
        inBulletList = true;
      }
      htmlParts.push(`<li>${escapeHtml(bulletText)}</li>`);
    } else {
      // Regular paragraph/text
      // Look ahead to merge lines that are part of the same paragraph
      // (similar font size, no large Y gap, not a heading/bullet)
      const paraLines = [text];
      let prevMergedLine = line;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        const nextText = next.text;
        if (!nextText) break;

        const sameFont = Math.abs(next.fontSize - line.fontSize) < 1;
        const yGap = Math.abs(prevMergedLine.y - next.y);
        const lineSpacing = line.fontSize * 2.2;
        const isConsecutive = yGap > 0 && yGap < lineSpacing && sameFont;
        const nextIsBullet = next.isBullet;
        const nextIsHeading = SECTION_HEADING_PATTERNS.test(nextText.trim()) ||
          (nextText === nextText.toUpperCase() && nextText.length > 2 && /[A-Z]/.test(nextText) && next.fontSize >= headingThreshold) ||
          (next.fontSize >= headingThreshold && nextText.length < 60);
        const nextIsVeryLarge = next.fontSize >= nameThreshold;

        if (isConsecutive && !nextIsBullet && !nextIsHeading && !nextIsVeryLarge) {
          paraLines.push(nextText);
          prevMergedLine = next;
          i++;
        } else {
          break;
        }
      }

      htmlParts.push(`<p>${paraLines.map(escapeHtml).join(' ')}</p>`);
    }

    i++;
  }

  // Close any open list
  if (inBulletList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function extractPdf(file: File): Promise<{ html: string; plainText: string }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: ReconstructedLine[] = [];
  const plainTextPages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: PdfTextItem[] = textContent.items
      .filter((item: any) => 'str' in item && item.str !== undefined)
      .map((item: any) => ({
        str: item.str as string,
        transform: item.transform as number[],
        fontName: (item.fontName || '') as string,
        height: item.height as number,
        width: item.width as number,
      }));

    const pageLines = reconstructLines(items);
    allLines.push(...classifyLines(pageLines));

    // Build plain text for this page
    const pageText = pageLines.map((l) => {
      if (l.isBullet) {
        const bulletText = l.text.replace(BULLET_CHARS, '').trim();
        return `  • ${bulletText}`;
      }
      return l.text;
    }).join('\n');
    plainTextPages.push(pageText);
  }

  const html = buildHtmlFromLines(allLines);
  const plainText = plainTextPages.join('\n\n');

  return { html, plainText };
}

async function extractDocx(file: File): Promise<{ html: string; plainText: string }> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Strip HTML tags to get plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  return { html, plainText };
}

async function extractTxt(file: File): Promise<{ html: string; plainText: string }> {
  const plainText = await readFileAsText(file);
  const html = wrapTextInHtml(plainText);
  return { html, plainText };
}

type TabMode = 'upload' | 'paste';

export default function ResumeUpload({ onResumeExtracted }: ResumeUploadProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const ext = getFileExtension(file.name);

      if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
        setError('Unsupported file type. Please upload a PDF, DOCX, DOC, or TXT file.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let result: { html: string; plainText: string };

        switch (ext) {
          case 'pdf':
            result = await extractPdf(file);
            break;
          case 'docx':
          case 'doc':
            result = await extractDocx(file);
            break;
          case 'txt':
            result = await extractTxt(file);
            break;
          default:
            throw new Error('Unsupported file type');
        }

        if (!result.plainText.trim()) {
          throw new Error(
            'No text could be extracted from this file. The file may be empty or contain only images.'
          );
        }

        setFileName(file.name);
        onResumeExtracted(result.html, result.plainText);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to extract content from file';
        setError(message);
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onResumeExtracted]
  );

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setError('Please paste your resume content first.');
      return;
    }

    setError(null);
    const html = wrapTextInHtml(trimmed);
    onResumeExtracted(html, trimmed);
  }, [pasteText, onResumeExtracted]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleRemove() {
    setFileName(null);
    setError(null);
    setPasteText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Compact view when a file is already loaded
  if (fileName && !isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--accent-light)] px-3 py-2">
        <svg
          className="h-4 w-4 flex-shrink-0 text-[var(--accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--accent)]" title={fileName}>
          {fileName}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-light)]"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab switcher */}
      <div className="flex rounded-lg bg-[var(--background)] p-0.5">
        <button
          type="button"
          onClick={() => { setActiveTab('upload'); setError(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload File
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('paste'); setError(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'paste'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            Paste Content
          </span>
        </button>
      </div>

      {/* Upload File tab */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            isDragOver
              ? 'border-[var(--accent)] bg-[var(--accent-light)]'
              : 'border-[var(--border-strong)] bg-[var(--background)] hover:border-[var(--border-strong)] hover:bg-[var(--background)]'
          } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-[var(--accent)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-[var(--text-secondary)]">Extracting content...</span>
            </div>
          ) : (
            <>
              <svg
                className="mb-2 h-8 w-8 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Drop your resume here or click to browse
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">PDF, DOCX, DOC, or TXT</p>
            </>
          )}
        </div>
      )}

      {/* Paste Content tab */}
      {activeTab === 'paste' && (
        <div className="flex flex-col gap-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your resume content here...&#10;&#10;e.g.&#10;John Doe&#10;Software Engineer&#10;john@example.com&#10;&#10;EXPERIENCE&#10;Senior Developer at Acme Corp..."
            className="h-48 w-full resize-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="button"
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Use This Content
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
