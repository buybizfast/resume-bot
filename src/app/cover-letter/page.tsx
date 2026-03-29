'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/hooks/useResumeStore';
import { useBlotato } from '@/hooks/useBlotato';
import { useAuthContext } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';
import { stripMarkdown } from '@/lib/text-utils';
import { exportToDocx, exportToPlainText } from '@/lib/export';

export default function CoverLetterPage() {
  const router = useRouter();
  const resumes = useResumeStore((state) => state.resumes);
  const { loading, error, generateCoverLetter } = useBlotato();
  const { user } = useAuthContext();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    resumes.length > 0 ? resumes[0].id : ''
  );
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tone, setTone] = useState<'professional' | 'conversational'>('professional');
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  const handleGenerate = useCallback(async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedResume) return;
    if (!jobDescription.trim()) return;
    if (!companyName.trim()) return;

    try {
      const result = await generateCoverLetter(
        selectedResume.plainText,
        jobDescription,
        companyName,
        tone
      );
      if (result && typeof result === 'object' && 'coverLetter' in result) {
        setGeneratedLetter(stripMarkdown((result as Record<string, string>).coverLetter));
      } else if (typeof result === 'string') {
        setGeneratedLetter(stripMarkdown(result));
      }
    } catch {
      // Error state handled by useBlotato
    }
  }, [user, selectedResume, jobDescription, companyName, tone, generateCoverLetter]);

  const handleCopy = useCallback(async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLetter;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [generatedLetter]);

  const handleDownloadDocx = useCallback(async () => {
    if (!generatedLetter) return;

    // Convert plain text to simple HTML for the DOCX exporter
    const paragraphs = generatedLetter
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const html = paragraphs
      .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
      .join('\n');

    const filename = companyName
      ? `Cover_Letter_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`
      : 'Cover_Letter.docx';

    await exportToDocx(html, filename);
  }, [generatedLetter, companyName]);

  const handleDownloadText = useCallback(() => {
    if (!generatedLetter) return;

    const filename = companyName
      ? `Cover_Letter_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
      : 'Cover_Letter.txt';

    exportToPlainText(generatedLetter, filename);
  }, [generatedLetter, companyName]);

  const isFormValid =
    selectedResumeId && jobDescription.trim().length > 0 && companyName.trim().length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
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
              Back to Dashboard
            </button>
            <div className="h-5 w-px bg-[var(--border-strong)]" />
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Cover Letter Generator
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column: Form */}
          <div className="space-y-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="mb-6 text-base font-semibold text-[var(--text-primary)]">
                Cover Letter Details
              </h2>

              {/* Resume selector */}
              <div className="mb-5">
                <label
                  htmlFor="resume-select"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Select Resume
                </label>
                {resumes.length === 0 ? (
                  <div className="rounded-md border border-[var(--gold)] bg-[var(--gold-light)] p-3">
                    <p className="text-sm text-[var(--gold)]">
                      No resumes found.{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/editor')}
                        className="font-medium underline"
                      >
                        Create one first
                      </button>
                      .
                    </p>
                  </div>
                ) : (
                  <select
                    id="resume-select"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Job description */}
              <div className="mb-5">
                <label
                  htmlFor="job-description"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Job Description
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={6}
                  className="w-full resize-y rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              {/* Company name */}
              <div className="mb-5">
                <label
                  htmlFor="company-name"
                  className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              {/* Tone selector */}
              <div className="mb-6">
                <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Tone
                </span>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="tone"
                      value="professional"
                      checked={tone === 'professional'}
                      onChange={() => setTone('professional')}
                      className="h-4 w-4 border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">Professional</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="tone"
                      value="conversational"
                      checked={tone === 'conversational'}
                      onChange={() => setTone('conversational')}
                      className="h-4 w-4 border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">Conversational</span>
                  </label>
                </div>
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!isFormValid || loading}
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
                    Generating...
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
                        d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.894.553l1.448 2.897 2.897 1.448a1 1 0 010 1.788l-2.897 1.448-1.448 2.897a1 1 0 01-1.788 0l-1.448-2.897L6.763 8.34a1 1 0 010-1.788l2.897-1.448L11.106 2.21A1 1 0 0112 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Generate Cover Letter
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-md border border-[var(--danger)] bg-[var(--danger-light)] p-3">
                  <p className="text-sm text-[var(--danger)]">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Preview */}
          <div className="space-y-4">
            {generatedLetter ? (
              <>
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--background)]"
                  >
                    {copySuccess ? (
                      <>
                        <svg
                          className="h-4 w-4 text-[var(--accent)]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="6" y="6" width="10" height="12" rx="1.5" />
                          <path d="M4 14V4a2 2 0 012-2h8" />
                        </svg>
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--background)]"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 17h14M10 3v10m0 0l-4-4m4 4l4-4" />
                    </svg>
                    Download as DOCX
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadText}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--background)]"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 17h14M10 3v10m0 0l-4-4m4 4l4-4" />
                    </svg>
                    Download as TXT
                  </button>
                </div>

                {/* Letter preview */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
                  <div className="prose prose-sm max-w-none">
                    {generatedLetter.split('\n').map((line, idx) => {
                      if (line.trim() === '') {
                        return <br key={idx} />;
                      }
                      return (
                        <p key={idx} className="mb-2 text-sm leading-relaxed text-[var(--text-primary)]">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-[var(--text-muted)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Your generated cover letter will appear here
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Fill in the details on the left and click Generate
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Sign in to generate your cover letter"
      />
    </div>
  );
}
