// --------------------------------------------------------------------------
// ats-scorer.ts
// Core ATS scoring algorithm. Evaluates a resume against a job description
// across six weighted categories totalling 100 points, then generates
// prioritised improvement suggestions.
// --------------------------------------------------------------------------

import type { ATSScoreResult, CategoryScore, Suggestion } from '@/types/scoring';
import { extractKeywords } from '@/lib/keyword-extractor';
import { detectSections, getSectionByName } from '@/lib/section-detector';
import type { DetectedSection } from '@/lib/section-detector';

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_SCORES = {
  keywordMatch: 35,
  sectionStructure: 20,
  formattingQuality: 15,
  experienceRelevance: 15,
  measurableImpact: 10,
  completeness: 5,
} as const;

const STANDARD_FONTS = [
  'arial',
  'calibri',
  'times new roman',
  'georgia',
  'helvetica',
  'helvetica neue',
  'cambria',
  'garamond',
  'verdana',
  'tahoma',
  'trebuchet ms',
  'book antiqua',
  'palatino',
  'century gothic',
  'lucida sans',
  'segoe ui',
  'roboto',
  'open sans',
  'lato',
  'source sans pro',
  'noto sans',
  'inter',
];

const STRONG_ACTION_VERBS = new Set([
  'led', 'developed', 'implemented', 'increased', 'reduced', 'managed',
  'designed', 'launched', 'built', 'optimized', 'created', 'improved',
  'achieved', 'generated', 'delivered', 'engineered', 'architected',
  'spearheaded', 'established', 'transformed', 'automated', 'streamlined',
  'mentored', 'negotiated', 'resolved', 'pioneered', 'directed',
  'orchestrated', 'revamped', 'accelerated', 'maximized', 'minimized',
  'scaled', 'integrated', 'executed', 'analyzed', 'defined', 'drove',
  'elevated', 'expanded', 'facilitated', 'formulated', 'guided',
  'influenced', 'initiated', 'introduced', 'modernized', 'overhauled',
  'produced', 'proposed', 'restructured', 'secured', 'simplified',
  'supervised', 'trained', 'upgraded', 'consolidated', 'coordinated',
  'cultivated', 'customized', 'decreased', 'doubled', 'tripled',
  'eliminated', 'enhanced', 'founded', 'identified', 'mobilized',
  'outperformed', 'partnered', 'reduced', 'reengineered', 'revitalized',
]);

const WEAK_ACTION_VERBS = new Set([
  'helped', 'assisted', 'worked on', 'responsible for',
  'participated in', 'involved in', 'tasked with', 'dealt with',
  'handled', 'supported', 'contributed to', 'aided',
  'was responsible for', 'was involved in', 'was tasked with',
]);

const REQUIRED_SECTIONS = [
  'Professional Summary',
  'Work Experience',
  'Skills',
  'Education',
] as const;

const QUANTIFICATION_REGEX =
  /\d+%|\$[\d,]+\.?\d*|\d+\+?\s*(?:users|clients|projects|team|members|people|revenue|sales|customers|employees|applications|transactions|requests|servers|databases|endpoints|microservices|repositories|releases|deployments|sprints|stories|tickets|incidents|accounts|leads|conversions|orders|products|sites|pages|campaigns|impressions|clicks|views|visitors|subscribers|downloads|installs|markets|countries|regions|stores|locations|offices|departments|partners|vendors|integrations|modules|features|components|apis|services|platforms|systems|tools|reports|dashboards|pipelines|workflows|processes|meetings|presentations|trainings|certifications|awards|patents|publications|articles)/gi;

const PERCENTAGE_OR_DOLLAR_REGEX = /\d+%|\$[\d,]+\.?\d*/g;
const NUMBER_WITH_CONTEXT_REGEX = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:x|times|fold|million|billion|thousand|k\b|m\b|mm\b)/gi;

// ── Helpers ───────────────────────────────────────────────────────────────

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Check if a keyword appears in a text block (case-insensitive, whole word).
 */
function keywordInText(keyword: string, text: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?:^|[\\s,;|/()\\[\\]\\-])${escaped}(?:[\\s,;|/()\\[\\]\\-]|$)`,
    'i'
  );
  return pattern.test(text);
}

/**
 * Count how many bullet points contain quantified results.
 */
function countQuantifiedBullets(text: string): number {
  // Split by likely bullet point delimiters
  const bullets = text.split(/(?:\n|<li>|<br\s*\/?>|[•\-\u2022\u2013\u2014])/i);
  let count = 0;

  for (const bullet of bullets) {
    const trimmed = bullet.trim();
    if (trimmed.length < 10) continue; // Skip very short fragments

    if (
      QUANTIFICATION_REGEX.test(trimmed) ||
      PERCENTAGE_OR_DOLLAR_REGEX.test(trimmed) ||
      NUMBER_WITH_CONTEXT_REGEX.test(trimmed)
    ) {
      count++;
    }

    // Reset regex lastIndex (they have the global flag)
    QUANTIFICATION_REGEX.lastIndex = 0;
    PERCENTAGE_OR_DOLLAR_REGEX.lastIndex = 0;
    NUMBER_WITH_CONTEXT_REGEX.lastIndex = 0;
  }

  return count;
}

/**
 * Extract probable job titles from resume text. Looks for lines that
 * appear to be job titles based on common patterns.
 */
function extractResumeTitles(text: string): string[] {
  const titles: string[] = [];

  // Common title patterns: lines that are short, capitalised, and followed
  // by company/date information
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Job titles are typically short (< 80 chars), often title-cased
    if (line.length > 5 && line.length < 80) {
      // Common job title keywords
      const titleKeywords = /\b(engineer|developer|manager|director|analyst|designer|architect|lead|senior|junior|principal|staff|vp|vice president|head of|chief|officer|consultant|specialist|coordinator|administrator|intern|associate|strategist|scientist|researcher)\b/i;
      if (titleKeywords.test(line)) {
        titles.push(normalise(line));
      }
    }
  }

  return titles;
}

/**
 * Extract a probable job title from a job description.
 * Typically the first meaningful line or a line after "Job Title:" / "Position:"
 */
function extractJDTitle(jobDescription: string): string {
  const lines = jobDescription.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const normLine = normalise(line);
    // Check for explicit title markers
    const titleMatch = normLine.match(
      /(?:job\s*title|position|role)\s*[:\-]\s*(.+)/i
    );
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Fallback: first short, non-generic line is often the title
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/[^\w\s\-/]/g, '').trim();
    if (clean.length > 3 && clean.length < 80 && clean.split(' ').length <= 8) {
      return normalise(clean);
    }
  }

  return '';
}

/**
 * Simple fuzzy title matching: compute word-overlap similarity.
 */
function titleSimilarity(resumeTitle: string, jdTitle: string): number {
  if (!resumeTitle || !jdTitle) return 0;

  const rWords = new Set(normalise(resumeTitle).split(/\s+/));
  const jWords = new Set(normalise(jdTitle).split(/\s+/));

  // Remove tiny stop words
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'at', 'in', 'for', '-', '/']);
  for (const sw of stopWords) {
    rWords.delete(sw);
    jWords.delete(sw);
  }

  if (rWords.size === 0 || jWords.size === 0) return 0;

  let overlap = 0;
  for (const word of rWords) {
    if (jWords.has(word)) overlap++;
  }

  // Jaccard-like similarity, biased towards the JD title
  return overlap / jWords.size;
}

/**
 * Count strong vs weak action verbs in text.
 */
function analyseActionVerbs(
  text: string
): { strongCount: number; weakCount: number; weakVerbs: string[] } {
  const normText = normalise(text);
  let strongCount = 0;
  let weakCount = 0;
  const weakVerbs: string[] = [];

  for (const verb of STRONG_ACTION_VERBS) {
    const pattern = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = normText.match(pattern);
    if (matches) strongCount += matches.length;
  }

  for (const phrase of WEAK_ACTION_VERBS) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = normText.match(pattern);
    if (matches) {
      weakCount += matches.length;
      weakVerbs.push(phrase);
    }
  }

  return { strongCount, weakCount, weakVerbs: [...new Set(weakVerbs)] };
}

// ── Scoring functions ─────────────────────────────────────────────────────

function scoreKeywordMatch(
  resumePlainText: string,
  sections: DetectedSection[],
  jobDescription: string
): {
  score: CategoryScore;
  matchedKeywords: string[];
  missingKeywords: string[];
} {
  const { allSkills } = extractKeywords(jobDescription);
  const details: string[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  if (allSkills.length === 0) {
    return {
      score: {
        score: MAX_SCORES.keywordMatch,
        maxScore: MAX_SCORES.keywordMatch,
        details: ['No specific skills detected in job description.'],
      },
      matchedKeywords: [],
      missingKeywords: [],
    };
  }

  // Get section content for positional weighting
  const summarySection = getSectionByName(sections, 'Professional Summary');
  const skillsSection = getSectionByName(sections, 'Skills');
  const experienceSection = getSectionByName(sections, 'Work Experience');
  const educationSection = getSectionByName(sections, 'Education');

  let totalWeight = 0;
  let matchedWeight = 0;

  for (const keyword of allSkills) {
    const inResume = keywordInText(keyword, resumePlainText);

    if (!inResume) {
      missingKeywords.push(keyword);
      totalWeight += 1; // Base weight for unmatched
      continue;
    }

    matchedKeywords.push(keyword);

    // Determine best positional weight
    let bestWeight = 0.5; // Found somewhere but not in a key section

    if (summarySection && keywordInText(keyword, summarySection.content)) {
      bestWeight = Math.max(bestWeight, 1.5);
    }
    if (skillsSection && keywordInText(keyword, skillsSection.content)) {
      bestWeight = Math.max(bestWeight, 1.3);
    }
    if (experienceSection && keywordInText(keyword, experienceSection.content)) {
      bestWeight = Math.max(bestWeight, 1.0);
    }
    if (educationSection && keywordInText(keyword, educationSection.content)) {
      bestWeight = Math.max(bestWeight, 0.8);
    }

    matchedWeight += bestWeight;
    totalWeight += bestWeight; // Use same weight for denominator to keep ratio fair
  }

  // Add base weight for missing keywords
  // totalWeight already includes 1 per missing keyword and bestWeight per matched keyword

  const ratio = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const rawScore = Math.round(ratio * MAX_SCORES.keywordMatch * 10) / 10;
  const score = Math.min(rawScore, MAX_SCORES.keywordMatch);

  const matchPct = Math.round((matchedKeywords.length / allSkills.length) * 100);
  details.push(
    `Matched ${matchedKeywords.length}/${allSkills.length} keywords (${matchPct}%).`
  );

  if (missingKeywords.length > 0) {
    const top5 = missingKeywords.slice(0, 5);
    details.push(
      `Missing: ${top5.join(', ')}${missingKeywords.length > 5 ? ` (+${missingKeywords.length - 5} more)` : ''}.`
    );
  }

  if (matchedKeywords.length > 0 && summarySection) {
    const inSummary = matchedKeywords.filter((k) =>
      keywordInText(k, summarySection.content)
    ).length;
    if (inSummary > 0) {
      details.push(`${inSummary} keyword(s) found in Professional Summary (1.5x weight).`);
    }
  }

  return {
    score: { score: Math.round(score * 10) / 10, maxScore: MAX_SCORES.keywordMatch, details },
    matchedKeywords,
    missingKeywords,
  };
}

function scoreSectionStructure(sections: DetectedSection[]): CategoryScore {
  const details: string[] = [];
  let score = 0;

  for (const requiredName of REQUIRED_SECTIONS) {
    const found = sections.find(
      (s) => s.standardName.toLowerCase() === requiredName.toLowerCase()
    );

    if (!found) {
      details.push(`Missing section: "${requiredName}".`);
    } else if (found.isStandard) {
      score += 5;
      details.push(`"${requiredName}" section found with standard heading.`);
    } else {
      score += 3;
      details.push(
        `"${requiredName}" section found as "${found.name}" (non-standard heading, -2 pts).`
      );
    }
  }

  return { score, maxScore: MAX_SCORES.sectionStructure, details };
}

function scoreFormattingQuality(html: string): CategoryScore {
  const details: string[] = [];
  let score = 0;

  // 3 pts: No tables
  const hasTables = /<table[\s>]/i.test(html);
  if (!hasTables) {
    score += 3;
    details.push('No table elements detected (good for ATS parsing).');
  } else {
    details.push('Table elements detected. Many ATS systems struggle to parse tables.');
  }

  // 3 pts: No images
  const hasImages = /<img[\s>]/i.test(html);
  if (!hasImages) {
    score += 3;
    details.push('No image elements detected (good for ATS parsing).');
  } else {
    details.push('Image elements detected. ATS systems cannot read images.');
  }

  // 3 pts: Standard fonts
  const fontFamilyRegex = /font-family\s*:\s*([^;}"']+)/gi;
  let fontMatch: RegExpExecArray | null;
  let hasNonStandardFont = false;
  let hasFontDeclaration = false;

  while ((fontMatch = fontFamilyRegex.exec(html)) !== null) {
    hasFontDeclaration = true;
    const fontValue = fontMatch[1].toLowerCase();
    // Extract individual font names from the font-family list
    const fonts = fontValue.split(',').map((f) => f.trim().replace(/["']/g, ''));
    for (const font of fonts) {
      const isStandard = STANDARD_FONTS.some(
        (sf) => font.includes(sf) || sf.includes(font)
      );
      if (!isStandard && font.length > 0 && font !== 'inherit' && font !== 'sans-serif' && font !== 'serif' && font !== 'monospace') {
        hasNonStandardFont = true;
        break;
      }
    }
    if (hasNonStandardFont) break;
  }

  if (!hasNonStandardFont) {
    score += 3;
    if (hasFontDeclaration) {
      details.push('Standard ATS-friendly fonts used.');
    } else {
      details.push('No custom font declarations (defaults are ATS-friendly).');
    }
  } else {
    details.push('Non-standard fonts detected. Use Arial, Calibri, or Times New Roman for best ATS compatibility.');
  }

  // 3 pts: Consistent bullet usage in experience section
  const hasListElements = /<ul[\s>]/i.test(html) && /<li[\s>]/i.test(html);
  if (hasListElements) {
    score += 3;
    details.push('Proper bullet list markup (<ul>/<li>) detected.');
  } else {
    // Check if they used other bullet-like characters without proper markup
    const hasBulletChars = /[•\u2022\u2013\u2014\-]\s+\w/g.test(stripHTML(html));
    if (hasBulletChars) {
      score += 1;
      details.push('Bullet characters found but not using proper HTML list markup. Use <ul>/<li> for better ATS parsing.');
    } else {
      details.push('No bullet lists detected. Use bulleted lists to describe experience and achievements.');
    }
  }

  // 3 pts: No excessive formatting (colored text, excessive bold/italic)
  const colorRegex = /(?:color\s*:\s*(?!(?:black|#000|#000000|rgb\(0|inherit|currentcolor))[^;}"']+)/gi;
  const colorMatches = html.match(colorRegex) || [];
  const colorCount = colorMatches.length;

  if (colorCount <= 2) {
    score += 3;
    details.push('Minimal use of colored text (good for ATS).');
  } else if (colorCount <= 5) {
    score += 1;
    details.push(`${colorCount} colored text elements detected. Reduce colored text for better ATS compatibility.`);
  } else {
    details.push(`${colorCount} colored text elements detected. Excessive color formatting can confuse ATS systems.`);
  }

  return { score, maxScore: MAX_SCORES.formattingQuality, details };
}

function scoreExperienceRelevance(
  resumePlainText: string,
  sections: DetectedSection[],
  jobDescription: string
): CategoryScore {
  const details: string[] = [];
  let score = 0;

  // ── 5 pts: Job title similarity ──
  const jdTitle = extractJDTitle(jobDescription);
  const resumeTitles = extractResumeTitles(resumePlainText);

  if (jdTitle && resumeTitles.length > 0) {
    let bestSimilarity = 0;
    let bestTitle = '';
    for (const rt of resumeTitles) {
      const sim = titleSimilarity(rt, jdTitle);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestTitle = rt;
      }
    }

    if (bestSimilarity >= 0.7) {
      score += 5;
      details.push(`Strong job title match found: "${bestTitle}" closely matches JD title.`);
    } else if (bestSimilarity >= 0.4) {
      score += 3;
      details.push(`Partial job title match: "${bestTitle}" has some overlap with JD title.`);
    } else if (bestSimilarity > 0) {
      score += 1;
      details.push(`Weak job title match. Consider aligning your title with the target role.`);
    } else {
      details.push('No job title match detected. Tailor your resume titles to match the target role.');
    }
  } else if (!jdTitle) {
    // Cannot determine JD title - give partial credit
    score += 2;
    details.push('Could not extract a clear job title from the description.');
  } else {
    details.push('No job titles detected in resume.');
  }

  // ── 5 pts: Strong action verbs ──
  const experienceSection = getSectionByName(sections, 'Work Experience');
  const experienceText = experienceSection ? experienceSection.content : resumePlainText;

  const { strongCount, weakCount, weakVerbs } = analyseActionVerbs(experienceText);

  if (strongCount >= 8 && weakCount <= 1) {
    score += 5;
    details.push(`Excellent use of action verbs (${strongCount} strong verbs found).`);
  } else if (strongCount >= 5) {
    score += 4;
    details.push(`Good use of action verbs (${strongCount} strong verbs).`);
    if (weakCount > 0) {
      details.push(`Replace weak verbs: ${weakVerbs.slice(0, 3).join(', ')}.`);
    }
  } else if (strongCount >= 3) {
    score += 2;
    details.push(`${strongCount} strong action verbs found. Add more impact-driven language.`);
    if (weakCount > 0) {
      details.push(`Weak verbs to replace: ${weakVerbs.slice(0, 3).join(', ')}.`);
    }
  } else {
    details.push('Few strong action verbs. Use words like "led", "developed", "implemented", "increased", "reduced".');
    if (weakCount > 0) {
      details.push(`Weak verbs found: ${weakVerbs.slice(0, 3).join(', ')}.`);
    }
  }

  // ── 5 pts: JD keywords appear in work experience context ──
  if (experienceSection) {
    const { allSkills } = extractKeywords(jobDescription);
    const keywordsInExperience = allSkills.filter((kw) =>
      keywordInText(kw, experienceSection.content)
    );

    const experienceKeywordRatio =
      allSkills.length > 0 ? keywordsInExperience.length / allSkills.length : 0;

    if (experienceKeywordRatio >= 0.5) {
      score += 5;
      details.push(
        `${keywordsInExperience.length} of ${allSkills.length} JD keywords appear in work experience context.`
      );
    } else if (experienceKeywordRatio >= 0.3) {
      score += 3;
      details.push(
        `${keywordsInExperience.length} of ${allSkills.length} JD keywords in experience. Weave more keywords into your experience bullets.`
      );
    } else if (experienceKeywordRatio > 0) {
      score += 1;
      details.push(
        `Only ${keywordsInExperience.length} of ${allSkills.length} JD keywords appear in experience. Most keywords should appear in context, not just the skills section.`
      );
    } else {
      details.push('No JD keywords found in work experience section. Integrate relevant skills into your experience descriptions.');
    }
  } else {
    details.push('No work experience section detected to evaluate keyword context.');
  }

  return { score, maxScore: MAX_SCORES.experienceRelevance, details };
}

function scoreMeasurableImpact(resumePlainText: string): CategoryScore {
  const details: string[] = [];
  const count = countQuantifiedBullets(resumePlainText);

  let score: number;
  if (count >= 5) {
    score = 10;
    details.push(`Excellent: ${count} quantified achievements found.`);
  } else if (count >= 3) {
    score = 6;
    details.push(`Good: ${count} quantified achievements. Aim for 5+ for maximum impact.`);
  } else if (count >= 1) {
    score = 3;
    details.push(`${count} quantified achievement(s) found. Add more numbers, percentages, and dollar amounts to strengthen your impact.`);
  } else {
    score = 0;
    details.push('No quantified achievements detected. Add metrics like "Increased revenue by 25%" or "Managed team of 12 engineers".');
  }

  return { score, maxScore: MAX_SCORES.measurableImpact, details };
}

function scoreCompleteness(resumePlainText: string, html: string): CategoryScore {
  const details: string[] = [];
  let score = 0;
  const normText = normalise(resumePlainText);

  // 1 pt: Email detected
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(resumePlainText)) {
    score += 1;
    details.push('Email address detected.');
  } else {
    details.push('No email address found. Include a professional email address.');
  }

  // 1 pt: Phone detected
  const phoneRegex =
    /(?:\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}|\+\d{1,3}[\s\-.]?\d{2,4}[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/;
  if (phoneRegex.test(resumePlainText)) {
    score += 1;
    details.push('Phone number detected.');
  } else {
    details.push('No phone number found. Include a contact phone number.');
  }

  // 1 pt: Consistent date format
  // Look for dates and check consistency
  const datePatterns = {
    monthYear: /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}/gi,
    numericSlash: /\d{1,2}\/\d{4}/g,
    numericDash: /\d{1,2}-\d{4}/g,
    yearOnly: /\b20\d{2}\b/g,
    mmYYYY: /\d{2}\/\d{4}/g,
  };

  const foundFormats: string[] = [];
  if (resumePlainText.match(datePatterns.monthYear)?.length) foundFormats.push('monthYear');
  if (resumePlainText.match(datePatterns.numericSlash)?.length) foundFormats.push('numericSlash');
  if (resumePlainText.match(datePatterns.numericDash)?.length) foundFormats.push('numericDash');

  // We allow yearOnly alongside one named format
  if (foundFormats.length <= 1) {
    score += 1;
    details.push('Date formatting appears consistent.');
  } else {
    details.push(`Mixed date formats detected (${foundFormats.join(', ')}). Use a single consistent format.`);
  }

  // 1 pt: Appropriate length (300-1500 words)
  const wordCount = resumePlainText.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount >= 300 && wordCount <= 1500) {
    score += 1;
    details.push(`Resume length is appropriate (${wordCount} words).`);
  } else if (wordCount < 300) {
    details.push(`Resume may be too short (${wordCount} words). Aim for 300-1500 words.`);
  } else {
    details.push(`Resume may be too long (${wordCount} words). Aim for 300-1500 words for a focused, ATS-friendly resume.`);
  }

  // 1 pt: LinkedIn or portfolio URL
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i;
  const portfolioRegex = /(?:github\.com|gitlab\.com|bitbucket\.org|behance\.net|dribbble\.com|medium\.com|dev\.to|portfolio|personal\s*(?:website|site))\/?[a-zA-Z0-9\-_./%]*/i;
  const genericURLRegex = /https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi;

  const hasLinkedIn = linkedinRegex.test(resumePlainText) || linkedinRegex.test(html);
  const hasPortfolio = portfolioRegex.test(resumePlainText) || portfolioRegex.test(html);

  if (hasLinkedIn || hasPortfolio) {
    score += 1;
    if (hasLinkedIn && hasPortfolio) {
      details.push('LinkedIn and portfolio/GitHub URL detected.');
    } else if (hasLinkedIn) {
      details.push('LinkedIn URL detected.');
    } else {
      details.push('Portfolio/GitHub URL detected.');
    }
  } else {
    details.push('No LinkedIn or portfolio URL found. Adding these strengthens your online presence.');
  }

  return { score, maxScore: MAX_SCORES.completeness, details };
}

// ── Suggestion generation ─────────────────────────────────────────────────

function generateSuggestions(
  breakdown: ATSScoreResult['breakdown'],
  matchedKeywords: string[],
  missingKeywords: string[],
  sections: DetectedSection[],
  resumePlainText: string,
  jobDescription: string
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { required, preferred } = extractKeywords(jobDescription);

  // ── HIGH priority ──

  // Missing required keywords
  const missingRequired = required.filter((kw) => missingKeywords.includes(kw));
  if (missingRequired.length > 0) {
    const top5 = missingRequired.slice(0, 5);
    suggestions.push({
      priority: 'high',
      category: 'Keywords',
      message: `Missing ${missingRequired.length} required keyword(s) from the job description: ${top5.join(', ')}${missingRequired.length > 5 ? '...' : ''}.`,
      action: `Add these skills to your resume, ideally in both the Skills section and within relevant work experience bullets. Use the exact phrasing from the job description.`,
    });
  }

  // Missing required sections
  for (const reqSection of REQUIRED_SECTIONS) {
    const found = sections.find(
      (s) => s.standardName.toLowerCase() === reqSection.toLowerCase()
    );
    if (!found) {
      suggestions.push({
        priority: 'high',
        category: 'Structure',
        message: `Missing "${reqSection}" section.`,
        action: `Add a clearly labeled "${reqSection}" section to your resume. ATS systems expect to find this section.`,
      });
    }
  }

  // No quantified achievements
  if (breakdown.measurableImpact.score === 0) {
    suggestions.push({
      priority: 'high',
      category: 'Impact',
      message: 'No quantified achievements found in your resume.',
      action: 'Add specific numbers, percentages, or dollar amounts to your experience bullets. For example: "Increased conversion rate by 35%" or "Managed $2M annual budget".',
    });
  }

  // Very low keyword match
  if (
    breakdown.keywordMatch.score < MAX_SCORES.keywordMatch * 0.3 &&
    missingKeywords.length > 3
  ) {
    suggestions.push({
      priority: 'high',
      category: 'Keywords',
      message: 'Very low keyword match with the job description.',
      action: 'Carefully review the job posting and mirror its key terminology throughout your resume. Focus on technical skills, tools, and methodologies mentioned in the requirements.',
    });
  }

  // ── MEDIUM priority ──

  // Weak action verbs
  const experienceSection = getSectionByName(sections, 'Work Experience');
  const experienceText = experienceSection ? experienceSection.content : resumePlainText;
  const { weakCount, weakVerbs } = analyseActionVerbs(experienceText);

  if (weakCount > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'Language',
      message: `Found ${weakCount} weak action verb(s): ${weakVerbs.slice(0, 3).join(', ')}.`,
      action: 'Replace weak verbs like "helped", "assisted", "responsible for" with strong action verbs like "led", "developed", "implemented", "increased", "reduced".',
    });
  }

  // Non-standard section headers
  const nonStandardSections = sections.filter(
    (s) =>
      !s.isStandard &&
      REQUIRED_SECTIONS.some(
        (rs) => rs.toLowerCase() === s.standardName.toLowerCase()
      )
  );
  if (nonStandardSections.length > 0) {
    for (const ns of nonStandardSections) {
      suggestions.push({
        priority: 'medium',
        category: 'Structure',
        message: `Section "${ns.name}" uses a non-standard heading.`,
        action: `Rename to "${ns.standardName}" for better ATS recognition.`,
      });
    }
  }

  // Missing preferred keywords
  const missingPreferred = preferred.filter((kw) => missingKeywords.includes(kw));
  if (missingPreferred.length > 0) {
    const top5 = missingPreferred.slice(0, 5);
    suggestions.push({
      priority: 'medium',
      category: 'Keywords',
      message: `Missing ${missingPreferred.length} preferred/bonus keyword(s): ${top5.join(', ')}${missingPreferred.length > 5 ? '...' : ''}.`,
      action: 'Consider adding these preferred skills if you have relevant experience. They can give you a competitive edge.',
    });
  }

  // Keywords only in skills section, not in experience context
  if (experienceSection) {
    const { allSkills } = extractKeywords(jobDescription);
    const keywordsOnlyInSkills = matchedKeywords.filter(
      (kw) =>
        !keywordInText(kw, experienceSection.content) &&
        getSectionByName(sections, 'Skills') &&
        keywordInText(kw, getSectionByName(sections, 'Skills')!.content)
    );

    if (keywordsOnlyInSkills.length >= 3) {
      suggestions.push({
        priority: 'medium',
        category: 'Experience',
        message: `${keywordsOnlyInSkills.length} keywords appear only in your Skills section, not in work experience.`,
        action: 'Weave key skills into your experience bullet points to show them in context. ATS systems value contextual keyword placement.',
      });
    }
  }

  // ── LOW priority ──

  // Formatting issues
  if (breakdown.formattingQuality.score < MAX_SCORES.formattingQuality * 0.7) {
    const fDetails = breakdown.formattingQuality.details;
    for (const detail of fDetails) {
      if (
        detail.includes('Table') ||
        detail.includes('Image') ||
        detail.includes('Non-standard font') ||
        detail.includes('color')
      ) {
        suggestions.push({
          priority: 'low',
          category: 'Formatting',
          message: detail,
          action: detail.includes('Table')
            ? 'Replace tables with simple text formatting or bullet lists.'
            : detail.includes('Image')
              ? 'Remove images; ATS systems cannot parse visual content.'
              : detail.includes('font')
                ? 'Switch to ATS-friendly fonts: Arial, Calibri, or Times New Roman.'
                : 'Reduce colored text to improve ATS parsing reliability.',
        });
      }
    }
  }

  // Add more quantification
  if (
    breakdown.measurableImpact.score > 0 &&
    breakdown.measurableImpact.score < MAX_SCORES.measurableImpact * 0.7
  ) {
    suggestions.push({
      priority: 'low',
      category: 'Impact',
      message: 'Some quantified achievements found, but there is room for more.',
      action: 'Try to quantify at least 5 bullet points with specific metrics. Use numbers, percentages, dollar amounts, or timeframes.',
    });
  }

  // Consider adding certifications
  const certSection = getSectionByName(sections, 'Certifications');
  if (!certSection) {
    const { allSkills } = extractKeywords(jobDescription);
    const certKeywords = [
      'certified', 'certification', 'certificate', 'pmp', 'aws certified',
      'comptia', 'cissp', 'cpa', 'scrum master', 'csm',
    ];
    const jdMentionsCerts = certKeywords.some((ck) =>
      normalise(jobDescription).includes(ck)
    );

    if (jdMentionsCerts) {
      suggestions.push({
        priority: 'low',
        category: 'Structure',
        message: 'The job description mentions certifications, but no Certifications section was found.',
        action: 'Add a "Certifications" section if you hold any relevant certifications or licenses.',
      });
    }
  }

  // Missing LinkedIn / portfolio
  if (breakdown.completeness.details.some((d) => d.includes('No LinkedIn'))) {
    suggestions.push({
      priority: 'low',
      category: 'Completeness',
      message: 'No LinkedIn or portfolio URL detected.',
      action: 'Add your LinkedIn profile URL and/or a link to your portfolio, GitHub, or personal website.',
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return suggestions;
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Calculate a comprehensive ATS compatibility score for a resume against a
 * job description. Returns a detailed breakdown across six categories
 * (100 points total) along with matched/missing keywords and prioritised
 * improvement suggestions.
 *
 * @param resumeHTML       The resume content as HTML
 * @param resumePlainText  The resume content as plain text
 * @param jobDescription   The target job description text
 * @returns                ATSScoreResult with score breakdown and suggestions
 */
export function calculateATSScore(
  resumeHTML: string,
  resumePlainText: string,
  jobDescription: string
): ATSScoreResult {
  // Detect resume sections from HTML
  const sections = detectSections(resumeHTML);

  // If plain text is empty, derive it from HTML
  const plainText =
    resumePlainText && resumePlainText.trim().length > 0
      ? resumePlainText
      : stripHTML(resumeHTML);

  // ── Score each category ──

  const keywordResult = scoreKeywordMatch(plainText, sections, jobDescription);
  const sectionStructure = scoreSectionStructure(sections);
  const formattingQuality = scoreFormattingQuality(resumeHTML);
  const experienceRelevance = scoreExperienceRelevance(
    plainText,
    sections,
    jobDescription
  );
  const measurableImpact = scoreMeasurableImpact(plainText);
  const completeness = scoreCompleteness(plainText, resumeHTML);

  const breakdown = {
    keywordMatch: keywordResult.score,
    sectionStructure,
    formattingQuality,
    experienceRelevance,
    measurableImpact,
    completeness,
  };

  // ── Total score ──

  const totalScore =
    keywordResult.score.score +
    sectionStructure.score +
    formattingQuality.score +
    experienceRelevance.score +
    measurableImpact.score +
    completeness.score;

  // ── Generate suggestions ──

  const suggestions = generateSuggestions(
    breakdown,
    keywordResult.matchedKeywords,
    keywordResult.missingKeywords,
    sections,
    plainText,
    jobDescription
  );

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown,
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    suggestions,
  };
}
