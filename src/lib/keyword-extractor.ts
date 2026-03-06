// --------------------------------------------------------------------------
// keyword-extractor.ts
// Extracts required, preferred, and general skills from a job description
// using a curated skill dictionary, variant normalisation, section-aware
// classification, and frequency analysis.
// --------------------------------------------------------------------------

export interface ExtractedKeywords {
  required: string[];
  preferred: string[];
  allSkills: string[];
}

// ── Skill dictionary (canonical lowercase forms) ──────────────────────────

const SKILL_DICTIONARY: Record<string, string[]> = {
  // Programming languages
  'programming languages': [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c',
    'ruby', 'go', 'golang', 'rust', 'php', 'swift', 'kotlin', 'scala',
    'r', 'matlab', 'perl', 'sql', 'html', 'css', 'sass', 'less',
    'objective-c', 'dart', 'elixir', 'haskell', 'clojure', 'lua',
    'shell', 'bash', 'powershell', 'groovy', 'coffeescript', 'f#',
    'visual basic', 'assembly', 'cobol', 'fortran', 'lisp', 'prolog',
    'solidity', 'zig', 'nim', 'julia',
  ],

  // Frameworks & libraries
  'frameworks': [
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'sveltekit',
    'django', 'flask', 'spring', 'spring boot', 'express', 'node.js',
    '.net', 'asp.net', 'rails', 'ruby on rails', 'laravel', 'fastapi',
    'nestjs', 'remix', 'gatsby', 'ember', 'backbone', 'jquery',
    'bootstrap', 'tailwind', 'tailwind css', 'material ui', 'chakra ui',
    'ant design', 'redux', 'mobx', 'zustand', 'rxjs', 'three.js',
    'd3.js', 'socket.io', 'graphql', 'apollo', 'prisma', 'sequelize',
    'hibernate', 'entity framework', 'flask', 'gin', 'fiber', 'actix',
    'rocket', 'phoenix', 'storybook', 'cypress', 'playwright', 'jest',
    'mocha', 'pytest', 'junit', 'selenium', 'puppeteer', 'webpack',
    'vite', 'rollup', 'esbuild', 'turbopack', 'parcel',
  ],

  // Cloud & DevOps
  'cloud and devops': [
    'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp',
    'google cloud', 'google cloud platform', 'docker', 'kubernetes',
    'terraform', 'ci/cd', 'jenkins', 'github actions', 'circleci',
    'ansible', 'puppet', 'chef', 'vagrant', 'packer', 'cloudformation',
    'pulumi', 'helm', 'istio', 'prometheus', 'grafana', 'datadog',
    'new relic', 'splunk', 'elk stack', 'logstash', 'kibana',
    'nginx', 'apache', 'caddy', 'traefik', 'load balancing',
    'auto scaling', 'serverless', 'lambda', 'cloud functions',
    'fargate', 'ecs', 'eks', 'aks', 'gke', 'openshift', 'rancher',
    'argocd', 'spinnaker', 'gitlab ci', 'teamcity', 'bamboo',
    'travis ci', 'bitbucket pipelines', 'vercel', 'netlify', 'heroku',
    'digitalocean', 'linode', 'cloudflare',
  ],

  // Databases & data
  'data': [
    'sql', 'nosql', 'mongodb', 'postgresql', 'postgres', 'mysql',
    'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'couchdb',
    'firebase', 'firestore', 'supabase', 'sqlite', 'oracle',
    'sql server', 'mariadb', 'neo4j', 'influxdb', 'timescaledb',
    'cockroachdb', 'planetscale', 'tableau', 'power bi', 'looker',
    'metabase', 'spark', 'apache spark', 'hadoop', 'snowflake',
    'bigquery', 'redshift', 'databricks', 'airflow', 'apache airflow',
    'kafka', 'apache kafka', 'rabbitmq', 'celery', 'etl', 'data pipeline',
    'data warehouse', 'data lake', 'data modeling', 'dbt',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn',
  ],

  // Methodologies
  'methodologies': [
    'agile', 'scrum', 'kanban', 'waterfall', 'six sigma', 'lean',
    'devops', 'devsecops', 'tdd', 'test-driven development',
    'bdd', 'behavior-driven development', 'ci/cd',
    'continuous integration', 'continuous delivery',
    'continuous deployment', 'pair programming', 'code review',
    'design patterns', 'solid principles', 'clean code',
    'domain-driven design', 'ddd', 'event-driven architecture',
    'microservices', 'monorepo', 'trunk-based development',
    'gitflow', 'feature flags', 'a/b testing', 'sprint planning',
    'retrospective', 'daily standup', 'story points',
    'okr', 'kpi', 'sla', 'sli', 'slo',
  ],

  // Marketing & business
  'marketing': [
    'seo', 'sem', 'google analytics', 'ga4', 'google ads',
    'google tag manager', 'gtm', 'hubspot', 'mailchimp',
    'salesforce', 'crm', 'content marketing', 'social media',
    'social media marketing', 'ppc', 'pay-per-click',
    'email marketing', 'marketing automation', 'conversion rate optimization',
    'cro', 'copywriting', 'content strategy', 'brand strategy',
    'digital marketing', 'growth hacking', 'product marketing',
    'market research', 'competitive analysis', 'customer acquisition',
    'retention', 'funnel optimization', 'lead generation',
    'demand generation', 'account-based marketing', 'abm',
    'influencer marketing', 'affiliate marketing', 'facebook ads',
    'instagram ads', 'linkedin ads', 'tiktok ads', 'programmatic advertising',
    'google search console', 'ahrefs', 'semrush', 'moz',
    'hootsuite', 'buffer', 'sprout social', 'marketo', 'pardot',
    'klaviyo', 'segment', 'mixpanel', 'amplitude', 'heap',
    'hotjar', 'fullstory', 'optimizely',
  ],

  // Design
  'design': [
    'figma', 'sketch', 'adobe creative suite', 'photoshop',
    'illustrator', 'xd', 'adobe xd', 'invision', 'ui/ux',
    'ui design', 'ux design', 'ux research', 'wireframing',
    'prototyping', 'user testing', 'usability testing',
    'responsive design', 'mobile-first design', 'design systems',
    'interaction design', 'visual design', 'graphic design',
    'motion design', 'animation', 'after effects',
    'premiere pro', 'final cut pro', 'blender', 'cinema 4d',
    'zeplin', 'abstract', 'principle', 'framer', 'canva',
    'indesign', 'lightroom', 'procreate',
    'information architecture', 'user personas', 'user journeys',
    'design thinking', 'accessibility', 'wcag', 'color theory',
    'typography',
  ],

  // Certifications
  'certifications': [
    'pmp', 'aws certified', 'aws solutions architect',
    'aws developer', 'aws sysops', 'cpa', 'cissp', 'cism',
    'comptia', 'comptia a+', 'comptia network+', 'comptia security+',
    'google certified', 'google cloud certified',
    'meta certified', 'hubspot certified', 'azure certified',
    'az-900', 'az-104', 'az-204', 'az-305',
    'certified scrum master', 'csm', 'safe', 'itil',
    'ccna', 'ccnp', 'ceh', 'oscp',
    'cka', 'ckad', 'cks',
    'hashicorp certified', 'terraform associate',
    'professional scrum master', 'psm',
    'six sigma green belt', 'six sigma black belt',
    'prince2', 'togaf', 'cobit',
  ],

  // General tech / emerging
  'general tech': [
    'machine learning', 'artificial intelligence', 'deep learning',
    'nlp', 'natural language processing', 'computer vision',
    'blockchain', 'web3', 'smart contracts', 'defi',
    'api', 'rest', 'rest api', 'restful', 'graphql', 'grpc',
    'microservices', 'monolith', 'soa', 'event sourcing', 'cqrs',
    'message queue', 'pub/sub', 'websocket', 'oauth', 'jwt',
    'saml', 'sso', 'single sign-on', 'rbac',
    'neural networks', 'pytorch', 'tensorflow', 'keras',
    'scikit-learn', 'hugging face', 'transformers', 'llm',
    'large language models', 'gpt', 'bert', 'diffusion models',
    'reinforcement learning', 'generative ai', 'prompt engineering',
    'rag', 'retrieval augmented generation', 'vector database',
    'pinecone', 'weaviate', 'chromadb', 'langchain',
    'data science', 'data engineering', 'data analysis',
    'business intelligence', 'statistical analysis',
    'cybersecurity', 'penetration testing', 'vulnerability assessment',
    'encryption', 'firewalls', 'ids/ips', 'siem',
    'iot', 'internet of things', 'edge computing',
    'ar', 'vr', 'augmented reality', 'virtual reality',
    'quantum computing', 'distributed systems',
    'system design', 'high availability', 'scalability',
    'performance optimization', 'caching', 'cdn',
    'mobile development', 'ios', 'android', 'react native',
    'flutter', 'xamarin', 'ionic', 'pwa',
    'progressive web app', 'web performance',
    'technical writing', 'documentation',
    'project management', 'product management',
    'stakeholder management', 'cross-functional',
    'leadership', 'mentoring', 'team management',
  ],
};

// Build a flat set of all canonical skills for fast lookup
const ALL_SKILLS_SET: Set<string> = new Set();
for (const category of Object.values(SKILL_DICTIONARY)) {
  for (const skill of category) {
    ALL_SKILLS_SET.add(skill.toLowerCase());
  }
}

// ── Variant / abbreviation mappings ───────────────────────────────────────

const VARIANT_MAP: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'k8s': 'kubernetes',
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'angular.js': 'angular',
  'angularjs': 'angular',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'elastic': 'elasticsearch',
  'tf': 'terraform',
  'gh actions': 'github actions',
  'gha': 'github actions',
  'ec2': 'aws',
  's3': 'aws',
  'rds': 'aws',
  'lambda': 'aws',
  'tailwindcss': 'tailwind css',
  'tailwind': 'tailwind css',
  'next': 'next.js',
  'nextjs': 'next.js',
  'nuxtjs': 'nuxt',
  'nuxt.js': 'nuxt',
  'dotnet': '.net',
  'dot net': '.net',
  'asp.net core': 'asp.net',
  'ror': 'ruby on rails',
  'ci': 'ci/cd',
  'cd': 'ci/cd',
  'ui': 'ui design',
  'ux': 'ux design',
  'ui/ux design': 'ui/ux',
  'ux/ui': 'ui/ux',
  'react native': 'react native',
  'rn': 'react native',
  'graphql': 'graphql',
  'gql': 'graphql',
  'aws cloud': 'aws',
  'amazon aws': 'aws',
  'google cloud': 'gcp',
  'microsoft azure': 'azure',
  'ms azure': 'azure',
};

// ── Stop words to ignore in frequency analysis ────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'we', 'you', 'your', 'our', 'their', 'its', 'his', 'her', 'my',
  'this', 'that', 'these', 'those', 'it', 'they', 'them', 'he', 'she',
  'who', 'which', 'what', 'where', 'when', 'how', 'why',
  'not', 'no', 'nor', 'if', 'then', 'else', 'so', 'than', 'too',
  'very', 'just', 'about', 'above', 'after', 'again', 'also', 'any',
  'because', 'before', 'between', 'both', 'each', 'few', 'more',
  'most', 'other', 'over', 'same', 'some', 'such', 'through', 'under',
  'until', 'up', 'while', 'all', 'into', 'during', 'only', 'own',
  // Common job-posting filler
  'experience', 'work', 'working', 'ability', 'team', 'role', 'position',
  'company', 'join', 'looking', 'ideal', 'candidate', 'strong',
  'excellent', 'good', 'great', 'plus', 'years', 'year', 'etc',
  'including', 'well', 'within', 'across', 'ensure', 'using',
  'related', 'relevant', 'required', 'preferred', 'desired',
  'knowledge', 'understanding', 'familiarity', 'proficiency',
  'skills', 'skill', 'tools', 'tool', 'technologies', 'technology',
  'environment', 'environments', 'new', 'based', 'level', 'high',
  'minimum', 'equivalent', 'degree', 'bachelor', 'master', 'phd',
  'apply', 'please', 'send', 'submit', 'resume', 'cover', 'letter',
]);

// ── Section markers ───────────────────────────────────────────────────────

const REQUIRED_MARKERS = [
  'required',
  'requirements',
  'required skills',
  'required qualifications',
  'must have',
  'must-have',
  'minimum qualifications',
  'basic qualifications',
  'qualifications',
  'what you need',
  'what we require',
  'key requirements',
  'essential',
  'essential skills',
  'mandatory',
];

const PREFERRED_MARKERS = [
  'preferred',
  'preferred qualifications',
  'preferred skills',
  'nice to have',
  'nice-to-have',
  'bonus',
  'bonus points',
  'desired',
  'desired qualifications',
  'desired skills',
  'additional qualifications',
  'a plus',
  'would be a plus',
  'advantageous',
  'good to have',
  'extras',
  'ideal candidate',
  'not required but',
];

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Normalise text for matching: lowercase, collapse whitespace, trim.
 */
function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Resolve a token through the variant map. Returns the canonical skill name
 * if found, otherwise returns the original token.
 */
function resolveVariant(token: string): string {
  const lower = token.toLowerCase().trim();
  return VARIANT_MAP[lower] ?? lower;
}

/**
 * Attempt to match multi-word skills in a text block. Returns an array of
 * canonical skill names found.
 */
function matchSkillsInText(text: string): string[] {
  const normText = normalise(text);
  const found: Set<string> = new Set();

  // First pass: try to match multi-word skills (longest first)
  const sortedSkills = Array.from(ALL_SKILLS_SET).sort(
    (a, b) => b.length - a.length
  );

  for (const skill of sortedSkills) {
    // Build a regex that matches the skill as a whole word/phrase
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:[\\s,;|/()\\[\\]]|$)`, 'i');
    if (pattern.test(normText)) {
      found.add(skill);
    }
  }

  // Second pass: check variant abbreviations
  for (const [variant, canonical] of Object.entries(VARIANT_MAP)) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:[\\s,;|/()\\[\\]]|$)`, 'i');
    if (pattern.test(normText)) {
      found.add(canonical);
    }
  }

  return Array.from(found);
}

/**
 * Classify text into required / preferred sections based on header markers.
 * Returns an object with `required` and `preferred` text segments.
 * Text that does not fall under either marker is treated as required
 * (conservative default).
 */
function classifySections(text: string): { required: string; preferred: string; general: string } {
  const lines = text.split('\n');
  let currentSection: 'required' | 'preferred' | 'general' = 'general';
  const sections = { required: '', preferred: '', general: '' };

  for (const line of lines) {
    const normLine = normalise(line);

    // Check if this line is a section header
    const isRequired = REQUIRED_MARKERS.some(
      (marker) =>
        normLine === marker ||
        normLine.startsWith(marker + ':') ||
        normLine.startsWith(marker + ' -') ||
        normLine.endsWith(marker) ||
        normLine.includes(marker + ':')
    );

    const isPreferred = PREFERRED_MARKERS.some(
      (marker) =>
        normLine === marker ||
        normLine.startsWith(marker + ':') ||
        normLine.startsWith(marker + ' -') ||
        normLine.endsWith(marker) ||
        normLine.includes(marker + ':')
    );

    if (isPreferred) {
      currentSection = 'preferred';
    } else if (isRequired) {
      currentSection = 'required';
    }

    sections[currentSection] += line + '\n';
  }

  return sections;
}

/**
 * Frequency analysis: find non-stop-word tokens that appear 3+ times.
 */
function getFrequentTerms(text: string, minCount: number = 3): string[] {
  const normText = normalise(text);
  // Extract individual words
  const words = normText.match(/[a-z][a-z0-9.#+\-]*/g) || [];
  const counts = new Map<string, number>();

  for (const word of words) {
    if (word.length < 2) continue;
    if (STOP_WORDS.has(word)) continue;
    const resolved = resolveVariant(word);
    counts.set(resolved, (counts.get(resolved) || 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([term]) => term);
}

/**
 * Deduplicate skills: if we have both "react" and "react.js", keep only
 * the canonical form.
 */
function deduplicateSkills(skills: string[]): string[] {
  const canonical = new Set<string>();
  for (const skill of skills) {
    canonical.add(resolveVariant(skill));
  }
  return Array.from(canonical).sort();
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Extracts keywords from a job description, classified into required,
 * preferred, and a combined list of all skills.
 */
export function extractKeywords(jobDescription: string): ExtractedKeywords {
  if (!jobDescription || jobDescription.trim().length === 0) {
    return { required: [], preferred: [], allSkills: [] };
  }

  // Strip any HTML tags (in case raw HTML was passed)
  const plainText = jobDescription.replace(/<[^>]*>/g, ' ');

  // 1. Classify sections
  const sections = classifySections(plainText);

  // 2. Extract skills from each section
  const requiredSkills = matchSkillsInText(sections.required);
  const preferredSkills = matchSkillsInText(sections.preferred);
  const generalSkills = matchSkillsInText(sections.general);

  // 3. Frequency analysis across the entire text
  const frequentTerms = getFrequentTerms(plainText);
  const frequentSkills = frequentTerms.filter(
    (term) => ALL_SKILLS_SET.has(term) || Object.values(VARIANT_MAP).includes(term)
  );

  // 4. Build final lists
  // Skills found in the required section + frequent skills default to required
  const requiredSet = new Set([...requiredSkills, ...frequentSkills]);

  // Skills found only in the preferred section
  const preferredSet = new Set<string>();
  for (const skill of preferredSkills) {
    if (!requiredSet.has(skill)) {
      preferredSet.add(skill);
    }
  }

  // General skills that aren't already classified go to required
  // (conservative: if we can't tell, assume it's required)
  for (const skill of generalSkills) {
    if (!requiredSet.has(skill) && !preferredSet.has(skill)) {
      requiredSet.add(skill);
    }
  }

  const required = deduplicateSkills(Array.from(requiredSet));
  const preferred = deduplicateSkills(Array.from(preferredSet));
  const allSkills = deduplicateSkills([...required, ...preferred]);

  return { required, preferred, allSkills };
}
