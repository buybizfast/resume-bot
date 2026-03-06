export interface JobBoard {
  name: string;
  url: string;
  description: string;
  categories: string[];
  trustScore: 'high' | 'medium';
}

export const JOB_BOARDS: JobBoard[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs',
    description:
      'The largest professional network with millions of job listings and recruiter outreach tools.',
    categories: [
      'tech',
      'finance',
      'healthcare',
      'creative',
      'marketing',
      'government',
      'remote',
      'general',
    ],
    trustScore: 'high',
  },
  {
    name: 'Indeed',
    url: 'https://www.indeed.com',
    description:
      'One of the largest job aggregators worldwide. Broad listings, but exercise caution and verify employers.',
    categories: [
      'tech',
      'finance',
      'healthcare',
      'creative',
      'marketing',
      'government',
      'remote',
      'general',
    ],
    trustScore: 'medium',
  },
  {
    name: 'FlexJobs',
    url: 'https://www.flexjobs.com',
    description:
      'Curated remote and flexible job listings. All postings are hand-screened to eliminate scams.',
    categories: ['remote', 'general'],
    trustScore: 'high',
  },
  {
    name: 'We Work Remotely',
    url: 'https://weworkremotely.com',
    description:
      'Leading remote-only job board focused on tech, design, and marketing roles.',
    categories: ['tech', 'remote', 'creative', 'marketing'],
    trustScore: 'high',
  },
  {
    name: 'Glassdoor',
    url: 'https://www.glassdoor.com/Job',
    description:
      'Job listings paired with company reviews, salary data, and interview insights.',
    categories: [
      'tech',
      'finance',
      'healthcare',
      'creative',
      'marketing',
      'government',
      'remote',
      'general',
    ],
    trustScore: 'high',
  },
  {
    name: 'ZipRecruiter',
    url: 'https://www.ziprecruiter.com',
    description:
      'AI-powered job matching platform that sends your profile to relevant employers automatically.',
    categories: [
      'tech',
      'finance',
      'healthcare',
      'creative',
      'marketing',
      'government',
      'remote',
      'general',
    ],
    trustScore: 'high',
  },
  {
    name: 'Wellfound (AngelList)',
    url: 'https://wellfound.com',
    description:
      'The go-to platform for startup and early-stage tech jobs with transparent salary ranges.',
    categories: ['tech', 'startups'],
    trustScore: 'high',
  },
  {
    name: 'Remote.co',
    url: 'https://remote.co/remote-jobs',
    description:
      'Curated remote job listings with company profiles and remote work resources.',
    categories: ['remote', 'general'],
    trustScore: 'high',
  },
  {
    name: 'Dice',
    url: 'https://www.dice.com',
    description:
      'Specialized job board for technology and IT professionals with salary estimator tools.',
    categories: ['tech', 'it'],
    trustScore: 'high',
  },
  {
    name: 'Built In',
    url: 'https://builtin.com/jobs',
    description:
      'Tech and startup job listings organized by city with company culture profiles.',
    categories: ['tech', 'startups'],
    trustScore: 'high',
  },
  {
    name: 'Behance Jobs',
    url: 'https://www.behance.net/joblist',
    description:
      'Creative job listings from Adobe, focused on design, illustration, and UX roles.',
    categories: ['creative', 'design'],
    trustScore: 'high',
  },
  {
    name: 'Mediabistro',
    url: 'https://www.mediabistro.com',
    description:
      'Job board specializing in media, marketing, PR, and communications positions.',
    categories: ['creative', 'marketing', 'media'],
    trustScore: 'high',
  },
  {
    name: 'eFinancialCareers',
    url: 'https://www.efinancialcareers.com',
    description:
      'Specialized job board for finance, banking, and fintech professionals worldwide.',
    categories: ['finance'],
    trustScore: 'high',
  },
  {
    name: 'Health eCareers',
    url: 'https://www.healthecareers.com',
    description:
      'Dedicated healthcare job board covering physicians, nurses, allied health, and administration.',
    categories: ['healthcare'],
    trustScore: 'high',
  },
  {
    name: 'USAJobs',
    url: 'https://www.usajobs.gov',
    description:
      'The official job board of the United States federal government with verified postings.',
    categories: ['government'],
    trustScore: 'high',
  },
];

/**
 * Returns recommended job boards for a given career field.
 * Always includes LinkedIn, Glassdoor, and ZipRecruiter as defaults.
 */
export function getRecommendedBoards(careerField: string): JobBoard[] {
  const field = careerField.toLowerCase();
  const defaultNames = ['LinkedIn', 'Glassdoor', 'ZipRecruiter'];

  const fieldMappings: Record<string, string[]> = {
    tech: ['We Work Remotely', 'Dice', 'Built In', 'Wellfound (AngelList)'],
    software: ['We Work Remotely', 'Dice', 'Built In', 'Wellfound (AngelList)'],
    engineering: ['We Work Remotely', 'Dice', 'Built In', 'Wellfound (AngelList)'],
    it: ['Dice', 'Built In', 'We Work Remotely'],
    developer: ['We Work Remotely', 'Dice', 'Built In', 'Wellfound (AngelList)'],
    data: ['Dice', 'Built In', 'We Work Remotely'],
    creative: ['Behance Jobs', 'Mediabistro'],
    design: ['Behance Jobs', 'Mediabistro', 'We Work Remotely'],
    ux: ['Behance Jobs', 'We Work Remotely', 'Built In'],
    art: ['Behance Jobs', 'Mediabistro'],
    finance: ['eFinancialCareers'],
    banking: ['eFinancialCareers'],
    accounting: ['eFinancialCareers'],
    fintech: ['eFinancialCareers', 'Wellfound (AngelList)', 'Built In'],
    healthcare: ['Health eCareers'],
    medical: ['Health eCareers'],
    nursing: ['Health eCareers'],
    health: ['Health eCareers'],
    government: ['USAJobs'],
    federal: ['USAJobs'],
    public: ['USAJobs'],
    remote: ['FlexJobs', 'Remote.co', 'We Work Remotely'],
    marketing: ['Mediabistro', 'We Work Remotely'],
    media: ['Mediabistro'],
    startup: ['Wellfound (AngelList)', 'Built In'],
  };

  // Collect additional board names based on all matching keywords
  const additionalNames = new Set<string>();

  for (const [keyword, boards] of Object.entries(fieldMappings)) {
    if (field.includes(keyword)) {
      for (const board of boards) {
        additionalNames.add(board);
      }
    }
  }

  // Combine default + field-specific board names
  const allNames = new Set([...defaultNames, ...additionalNames]);

  // Map names back to board objects, preserving order
  const results: JobBoard[] = [];
  for (const name of allNames) {
    const board = JOB_BOARDS.find((b) => b.name === name);
    if (board) {
      results.push(board);
    }
  }

  return results;
}
