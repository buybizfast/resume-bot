'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBlotato } from '@/hooks/useBlotato';
import { stripMarkdown } from '@/lib/text-utils';

interface ScamResult {
  riskScore: number;
  redFlags: string[];
  aiAnalysis: string;
  sources?: string[];
}

function RiskBadge({ score }: { score: number }) {
  let label: string;
  let colorClasses: string;

  if (score < 35) {
    label = 'LOW RISK';
    colorClasses = 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]';
  } else if (score < 65) {
    label = 'MEDIUM RISK';
    colorClasses = 'bg-[var(--gold-light)] text-[var(--gold)] border-[var(--gold)]';
  } else {
    label = 'HIGH RISK';
    colorClasses = 'bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger)]';
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-bold ${colorClasses}`}
      >
        {label}
      </span>
      <span className="text-sm text-[var(--text-tertiary)]">Score: {score}/100</span>
    </div>
  );
}

export default function ScamCheckPage() {
  const router = useRouter();
  const { loading, error, checkScam } = useBlotato();

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<ScamResult | null>(null);

  const handleCheck = useCallback(async () => {
    if (!companyName.trim()) return;

    try {
      const response = await checkScam(
        companyName.trim(),
        jobTitle.trim() || undefined,
        jobUrl.trim() || undefined,
        jobDescription.trim() || undefined
      );

      if (response) {
        // The hook returns the raw API response; normalize it
        const normalized: ScamResult = {
          riskScore: response.riskScore ?? 0,
          redFlags: response.redFlags ?? [],
          aiAnalysis: response.aiAnalysis ?? response.result ?? '',
          sources: response.sources ?? [],
        };
        setResult(normalized);
      }
    } catch {
      // Error handled by useBlotato
    }
  }, [companyName, jobTitle, jobUrl, jobDescription, checkScam]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Home
          </button>
          <div className="h-5 w-px bg-[var(--border-strong)]" />
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Job Scam Checker</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Description */}
        <div className="mb-8">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Protect yourself from job scams. Enter the details of a job posting and our
            AI will analyze it for common red flags and verify the company&apos;s legitimacy.
          </p>
        </div>

        {/* Input section */}
        <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">
            Job Posting Details
          </h2>

          <div className="space-y-4">
            {/* Company name - required */}
            <div>
              <label
                htmlFor="company-name"
                className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Company Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                required
                className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Job title - optional */}
            <div>
              <label
                htmlFor="job-title"
                className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Job Title{' '}
                <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Job posting URL - optional */}
            <div>
              <label
                htmlFor="job-url"
                className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Job Posting URL{' '}
                <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <input
                id="job-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Job description - optional */}
            <div>
              <label
                htmlFor="job-desc"
                className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Job Description{' '}
                <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <p className="mb-1.5 text-xs text-[var(--text-muted)]">
                Paste the full job posting for deeper analysis
              </p>
              <textarea
                id="job-desc"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting text here..."
                rows={6}
                className="w-full resize-y rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Check button */}
            <button
              type="button"
              onClick={handleCheck}
              disabled={!companyName.trim() || loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--border-strong)] disabled:text-[var(--text-tertiary)]"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Check This Job
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-lg border border-[var(--danger)] bg-[var(--danger-light)] p-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-[var(--danger)]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
            </div>
          </div>
        )}

        {/* Results section */}
        {result && (
          <div className="space-y-6">
            {/* Risk level */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                Risk Assessment
              </h2>
              <RiskBadge score={result.riskScore} />

              {/* Risk meter */}
              <div className="mt-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.riskScore < 35
                        ? 'bg-[var(--accent)]'
                        : result.riskScore < 65
                        ? 'bg-[var(--gold)]'
                        : 'bg-[var(--danger)]'
                    }`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]">
                  <span>Safe</span>
                  <span>Risky</span>
                </div>
              </div>
            </div>

            {/* Local analysis: Red flags */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                Red Flags Found
              </h2>
              {result.redFlags.length > 0 ? (
                <ul className="space-y-3">
                  {result.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-[var(--text-secondary)]">{stripMarkdown(flag)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2.5 rounded-md bg-[var(--accent-light)] p-3">
                  <svg
                    className="h-5 w-5 text-[var(--accent)]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-[var(--accent)]">
                    No obvious red flags detected
                  </span>
                </div>
              )}
            </div>

            {/* AI verification */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                AI Verification
              </h2>
              <div className="rounded-md bg-[var(--background)] p-4">
                <div className="prose prose-sm max-w-none">
                  {result.aiAnalysis.split('\n').map((line, idx) => {
                    if (line.trim() === '') return <br key={idx} />;
                    return (
                      <p key={idx} className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {stripMarkdown(line)}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Sources
                  </h3>
                  <ul className="space-y-1">
                    {result.sources.map((source, idx) => (
                      <li key={idx}>
                        <a
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] underline hover:text-[var(--accent-hover)]"
                        >
                          {source}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
