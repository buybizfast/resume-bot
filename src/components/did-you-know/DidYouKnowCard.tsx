'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJobStore } from '@/hooks/useJobStore';
import { useResumeStore } from '@/hooks/useResumeStore';
import { useBlotato } from '@/hooks/useBlotato';
import { useDebounce } from '@/hooks/useDebounce';
import { stripMarkdown } from '@/lib/text-utils';

/**
 * Attempts to extract a job title from a job description string.
 */
function extractJobTitle(description: string): string {
  const patterns = [
    /(?:hiring|looking for|seeking)\s+(?:a|an)\s+(.+?)(?:\.|,|\n|$)/i,
    /(.+?)\s+position/i,
    /position:\s*(.+?)(?:\n|$)/i,
    /job\s+title:\s*(.+?)(?:\n|$)/i,
    /role:\s*(.+?)(?:\n|$)/i,
    /title:\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 2 && title.length < 80) {
        return title;
      }
    }
  }

  const firstLine = description.split('\n').find((line) => line.trim().length > 0);
  if (firstLine) {
    const trimmed = firstLine.trim();
    return trimmed.length > 60 ? trimmed.slice(0, 60) : trimmed;
  }

  return 'general';
}

/**
 * Attempts to infer a career field from the job description text.
 */
function inferCareerField(description: string): string {
  const lower = description.toLowerCase();

  const fieldKeywords: Record<string, string[]> = {
    technology: ['software', 'developer', 'engineer', 'programming', 'frontend', 'backend', 'fullstack', 'devops', 'cloud', 'api'],
    design: ['designer', 'ux', 'ui', 'graphic', 'visual', 'figma', 'sketch', 'creative director'],
    marketing: ['marketing', 'seo', 'content strategist', 'social media', 'brand', 'campaign', 'growth', 'digital marketing'],
    finance: ['finance', 'accounting', 'banking', 'financial', 'investment', 'audit', 'cpa'],
    healthcare: ['healthcare', 'medical', 'nursing', 'clinical', 'patient', 'hospital', 'physician'],
    data: ['data scientist', 'data analyst', 'machine learning', 'analytics', 'data engineer', 'bi analyst'],
    product: ['product manager', 'product owner', 'product lead', 'product management'],
    sales: ['sales', 'business development', 'account executive', 'revenue', 'account manager'],
    hr: ['human resources', 'recruiter', 'talent acquisition', 'people operations', 'hr manager'],
    operations: ['operations', 'supply chain', 'logistics', 'project manager', 'program manager'],
    legal: ['attorney', 'lawyer', 'legal', 'compliance', 'paralegal', 'contract'],
    education: ['teacher', 'professor', 'instructor', 'curriculum', 'education', 'training'],
  };

  for (const [field, keywords] of Object.entries(fieldKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return field;
    }
  }

  return 'general';
}

interface Recommendation {
  tool: string;
  project: string;
  resumeBullet: string;
  whyItStandsOut: string;
}

export default function DidYouKnowCard() {
  const jobDescription = useJobStore((state) => state.jobDescription);
  const debouncedDescription = useDebounce(jobDescription, 2000);
  const getActiveResume = useResumeStore((state) => state.getActiveResume);
  const { getDidYouKnow, loading, error } = useBlotato();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const lastFetchedRef = useRef<string>('');

  const fetchRecommendations = useCallback(
    async (desc: string) => {
      if (!desc || desc.trim().length < 20) return;

      const jobTitle = extractJobTitle(desc);
      const careerField = inferCareerField(desc);

      // Get a snippet of the resume to help personalize recommendations
      const activeResume = getActiveResume();
      const resumeSnippet = activeResume?.plainText
        ? activeResume.plainText.slice(0, 1500)
        : '';

      setLocalLoading(true);
      setDismissed(false);

      try {
        const result = await getDidYouKnow(jobTitle, careerField, resumeSnippet);
        if (result && Array.isArray(result.recommendations)) {
          setRecommendations(result.recommendations);
        } else if (result && typeof result === 'object') {
          // Handle string fallback
          const text = (result as Record<string, unknown>).result;
          if (typeof text === 'string') {
            const parsed = text
              .split('\n')
              .map((line: string) =>
                line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').trim()
              )
              .filter((line: string) => line.length > 10);
            setRecommendations(
              parsed.slice(0, 5).map((p) => ({
                tool: '',
                project: p,
                resumeBullet: '',
                whyItStandsOut: '',
              }))
            );
          }
        }
      } catch {
        // Error tracked in useBlotato
      } finally {
        setLocalLoading(false);
      }
    },
    [getDidYouKnow, getActiveResume]
  );

  // Auto-trigger when debounced description changes
  useEffect(() => {
    if (
      debouncedDescription &&
      debouncedDescription.trim().length >= 20 &&
      debouncedDescription !== lastFetchedRef.current
    ) {
      lastFetchedRef.current = debouncedDescription;
      fetchRecommendations(debouncedDescription);
    }
  }, [debouncedDescription, fetchRecommendations]);

  const handleRefresh = useCallback(() => {
    if (jobDescription && jobDescription.trim().length >= 20) {
      lastFetchedRef.current = '';
      fetchRecommendations(jobDescription);
    }
  }, [jobDescription, fetchRecommendations]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't show if no job description
  if (!jobDescription || jobDescription.trim().length < 20) {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="w-full rounded-md bg-purple-50 px-3 py-2 text-left text-[10px] font-medium text-purple-600 transition-colors hover:bg-purple-100"
      >
        Show AI Resume Tips
      </button>
    );
  }

  const isLoading = loading || localLoading;

  return (
    <div className="w-full rounded-lg border border-purple-200 bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600">
            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-purple-900">Boost Your Resume with AI</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Get new ideas"
            className="rounded p-1 text-purple-500 transition-colors hover:bg-purple-100 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0115-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 01-15 6.7L3 16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Minimize"
            className="rounded p-1 text-purple-400 transition-colors hover:bg-purple-100 hover:text-purple-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {isLoading ? (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
              Analyzing your resume & job description...
            </div>
            <div className="space-y-2">
              <div className="h-3 animate-pulse rounded bg-purple-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-purple-100" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-purple-100" />
            </div>
          </div>
        ) : error ? (
          <p className="py-1 text-xs text-[var(--danger)]">
            Could not load AI tips. Click refresh to try again.
          </p>
        ) : recommendations.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-purple-500">
              Stand out by adding these AI skills to your resume:
            </p>
            {recommendations.map((rec, idx) => (
              <div key={idx} className="group">
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className={`w-full rounded-md border px-2.5 py-2 text-left text-xs transition-all ${
                    expandedIdx === idx
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-transparent hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-purple-600 text-[9px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {rec.tool && (
                          <span className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                            {stripMarkdown(rec.tool)}
                          </span>
                        )}
                        <svg
                          className={`ml-auto h-3 w-3 shrink-0 text-purple-400 transition-transform ${
                            expandedIdx === idx ? 'rotate-180' : ''
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="mt-0.5 leading-relaxed text-[var(--text-primary)]">
                        {stripMarkdown(rec.project)}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedIdx === idx && (rec.resumeBullet || rec.whyItStandsOut) && (
                  <div className="ml-6 mt-1 space-y-2 rounded-md border border-purple-200 bg-white px-3 py-2.5">
                    {rec.resumeBullet && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500">
                          Put this on your resume:
                        </p>
                        <p className="mt-0.5 text-xs font-medium italic leading-relaxed text-[var(--text-primary)]">
                          &ldquo;{stripMarkdown(rec.resumeBullet)}&rdquo;
                        </p>
                      </div>
                    )}
                    {rec.whyItStandsOut && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500">
                          Why recruiters care:
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                          {stripMarkdown(rec.whyItStandsOut)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-1 text-xs text-purple-600">
            Getting personalized AI tips for your field...
          </p>
        )}
      </div>
    </div>
  );
}
