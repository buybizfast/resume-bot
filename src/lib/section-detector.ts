// --------------------------------------------------------------------------
// section-detector.ts
// Detects resume sections from HTML content by scanning headings and
// bold/strong elements, mapping them to standard ATS section names.
// --------------------------------------------------------------------------

export interface DetectedSection {
  /** The original heading text found in the resume */
  name: string;
  /** The canonical ATS-friendly section name */
  standardName: string;
  /** Whether the heading exactly matches a standard name */
  isStandard: boolean;
  /** The text content of this section (between this heading and the next) */
  content: string;
}

// ── Standard sections and their aliases ───────────────────────────────────

interface SectionMapping {
  standardName: string;
  /** The canonical name plus all known aliases (all lowercase) */
  aliases: string[];
}

const SECTION_MAPPINGS: SectionMapping[] = [
  {
    standardName: 'Professional Summary',
    aliases: [
      'professional summary',
      'summary',
      'objective',
      'career objective',
      'profile',
      'professional profile',
      'about',
      'about me',
      'overview',
      'career summary',
      'executive summary',
      'personal statement',
      'introduction',
      'career profile',
      'professional overview',
      'summary of qualifications',
    ],
  },
  {
    standardName: 'Work Experience',
    aliases: [
      'work experience',
      'experience',
      'employment',
      'employment history',
      'work history',
      'professional experience',
      'career history',
      'relevant experience',
      'career experience',
      'positions held',
      'job history',
      'professional background',
      'employment record',
    ],
  },
  {
    standardName: 'Skills',
    aliases: [
      'skills',
      'technical skills',
      'core competencies',
      'key skills',
      'areas of expertise',
      'proficiencies',
      'competencies',
      'core skills',
      'professional skills',
      'skill set',
      'expertise',
      'capabilities',
      'technologies',
      'tools & technologies',
      'tools and technologies',
      'tech stack',
      'technical proficiencies',
      'technical competencies',
    ],
  },
  {
    standardName: 'Education',
    aliases: [
      'education',
      'academic',
      'academic background',
      'qualifications',
      'academic qualifications',
      'degrees',
      'educational background',
      'academic history',
      'education & training',
      'education and training',
      'academic credentials',
      'schooling',
    ],
  },
  {
    standardName: 'Certifications',
    aliases: [
      'certifications',
      'certificates',
      'licenses',
      'licenses & certifications',
      'licenses and certifications',
      'credentials',
      'professional development',
      'professional certifications',
      'training & certifications',
      'training and certifications',
      'accreditations',
      'continuing education',
    ],
  },
  {
    standardName: 'Projects',
    aliases: [
      'projects',
      'portfolio',
      'key projects',
      'selected projects',
      'personal projects',
      'notable projects',
      'featured projects',
      'side projects',
      'project experience',
      'relevant projects',
    ],
  },
  // Additional common sections (not scored but useful to detect)
  {
    standardName: 'Awards',
    aliases: [
      'awards',
      'honors',
      'awards & honors',
      'awards and honors',
      'achievements',
      'recognition',
      'accomplishments',
    ],
  },
  {
    standardName: 'Publications',
    aliases: [
      'publications',
      'research',
      'papers',
      'published works',
      'research publications',
    ],
  },
  {
    standardName: 'Volunteer Experience',
    aliases: [
      'volunteer experience',
      'volunteer work',
      'volunteering',
      'community involvement',
      'community service',
    ],
  },
  {
    standardName: 'Languages',
    aliases: [
      'languages',
      'language skills',
      'language proficiency',
    ],
  },
  {
    standardName: 'References',
    aliases: [
      'references',
      'professional references',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Strip all HTML tags and return plain text.
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalise text for comparison: lowercase, collapse whitespace, strip
 * leading/trailing punctuation.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s&/\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempt to match a heading against the section mappings.
 * Returns the mapping and whether it was an exact standard-name match.
 */
function matchSection(
  headingText: string
): { mapping: SectionMapping; isStandard: boolean } | null {
  const normHeading = normalise(headingText);

  if (!normHeading || normHeading.length === 0) return null;

  for (const mapping of SECTION_MAPPINGS) {
    const normStandard = normalise(mapping.standardName);

    // Exact match to the standard name
    if (normHeading === normStandard) {
      return { mapping, isStandard: true };
    }

    // Match against aliases
    for (const alias of mapping.aliases) {
      const normAlias = normalise(alias);
      if (normHeading === normAlias) {
        // isStandard is true only if it matches the canonical standard name
        return {
          mapping,
          isStandard: normHeading === normStandard,
        };
      }
    }
  }

  // Fuzzy fallback: check if the heading *contains* an alias or vice versa
  for (const mapping of SECTION_MAPPINGS) {
    for (const alias of mapping.aliases) {
      const normAlias = normalise(alias);
      // The heading contains the full alias, or the alias contains the full heading
      // (but only if the heading is at least 3 characters to avoid false positives)
      if (
        normHeading.length >= 3 &&
        (normHeading.includes(normAlias) || normAlias.includes(normHeading))
      ) {
        return { mapping, isStandard: false };
      }
    }
  }

  return null;
}

/**
 * A simple regex-based heading extractor. Finds content in h1-h6 tags,
 * as well as standalone <strong> or <b> elements that look like headings
 * (i.e. they are the only content on their line / in their block).
 *
 * Returns an array of { text, index } where index is the position in
 * the original HTML string.
 */
function extractHeadings(html: string): Array<{ text: string; index: number }> {
  const headings: Array<{ text: string; index: number }> = [];

  // Match h1-h6
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const text = stripHTML(match[1]);
    if (text.length > 0 && text.length < 100) {
      headings.push({ text, index: match.index });
    }
  }

  // Match standalone <strong> or <b> that look like section headings.
  // Heuristic: the strong/b element is either:
  //   - Inside a <p> that contains *only* the strong/b text, or
  //   - At the beginning of a line with minimal surrounding text
  const strongPatterns = [
    // <p><strong>...</strong></p>  or <p><b>...</b></p>
    /<p[^>]*>\s*<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>/gi,
    // <div><strong>...</strong></div>
    /<div[^>]*>\s*<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/div>/gi,
    // Standalone <strong>...</strong> followed by <br> or block-level element
    /<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*(?:<br\s*\/?>|<\/?\s*(?:div|p|section|article))/gi,
  ];

  for (const pattern of strongPatterns) {
    while ((match = pattern.exec(html)) !== null) {
      const text = stripHTML(match[1]);
      // Only treat as a heading if it looks like a section label:
      // short (< 60 chars), no sentence-like structure
      if (
        text.length > 0 &&
        text.length < 60 &&
        !text.includes('.') &&
        text.split(' ').length <= 6
      ) {
        // Avoid duplicates (already found as h1-h6)
        const isDuplicate = headings.some(
          (h) => Math.abs(h.index - match!.index) < 10 && normalise(h.text) === normalise(text)
        );
        if (!isDuplicate) {
          headings.push({ text, index: match.index });
        }
      }
    }
  }

  // Sort by position in document
  headings.sort((a, b) => a.index - b.index);

  return headings;
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Detect resume sections from HTML content.
 *
 * Scans the HTML for heading elements (h1-h6, bold/strong block elements),
 * maps each to a standard ATS section name, and extracts the content between
 * successive headings.
 */
export function detectSections(html: string): DetectedSection[] {
  if (!html || html.trim().length === 0) {
    return [];
  }

  const headings = extractHeadings(html);
  const sections: DetectedSection[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];

    // Extract content between this heading and the next
    const startIndex = heading.index;
    const endIndex = nextHeading ? nextHeading.index : html.length;
    const rawContent = html.slice(startIndex, endIndex);
    const content = stripHTML(rawContent);

    // Try to match to a standard section
    const matchResult = matchSection(heading.text);

    if (matchResult) {
      sections.push({
        name: heading.text,
        standardName: matchResult.mapping.standardName,
        isStandard: matchResult.isStandard,
        content,
      });
    } else {
      // Unknown section: still include it as non-standard
      sections.push({
        name: heading.text,
        standardName: heading.text,
        isStandard: false,
        content,
      });
    }
  }

  return sections;
}

/**
 * Convenience: get a single section by its standard name.
 * Returns the first match or undefined.
 */
export function getSectionByName(
  sections: DetectedSection[],
  standardName: string
): DetectedSection | undefined {
  const norm = standardName.toLowerCase();
  return sections.find((s) => s.standardName.toLowerCase() === norm);
}

/**
 * Convenience: check if a set of standard section names are present.
 * Returns a map of standardName -> boolean.
 */
export function checkRequiredSections(
  sections: DetectedSection[],
  requiredNames: string[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const name of requiredNames) {
    result[name] = sections.some(
      (s) => s.standardName.toLowerCase() === name.toLowerCase()
    );
  }
  return result;
}
