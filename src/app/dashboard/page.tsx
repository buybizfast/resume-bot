'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/hooks/useResumeStore';
import { useUserCredits } from '@/hooks/useUserCredits';
import { RESUME_TEMPLATES } from '@/lib/resume-templates';
import ResumeUpload from '@/components/editor/ResumeUpload';
import UserMenu from '@/components/auth/UserMenu';

function ATSScoreStamp({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex items-center justify-center rounded border border-dashed border-[var(--border-strong)] px-2 py-0.5 opacity-40">
        <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium text-[var(--text-tertiary)]">
          --
        </span>
      </div>
    );
  }

  let borderColor: string;
  let textColor: string;
  if (score >= 75) {
    borderColor = 'var(--score-excellent)';
    textColor = 'var(--score-excellent)';
  } else if (score >= 60) {
    borderColor = 'var(--score-good)';
    textColor = 'var(--score-good)';
  } else if (score >= 40) {
    borderColor = 'var(--score-fair)';
    textColor = 'var(--score-fair)';
  } else {
    borderColor = 'var(--score-poor)';
    textColor = 'var(--score-poor)';
  }

  return (
    <div
      className="flex -rotate-6 items-center gap-1 rounded border-2 px-2 py-0.5"
      style={{ borderColor }}
    >
      <span
        className="font-[family-name:var(--font-mono)] text-xs font-bold"
        style={{ color: textColor }}
      >
        {score}%
      </span>
    </div>
  );
}

function PaperPreview() {
  return (
    <div className="space-y-2 p-4">
      <div className="h-2.5 w-3/5 rounded-sm bg-[var(--border)]" />
      <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
      <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
      <div className="h-1 w-4/5 rounded-sm bg-[var(--border-light)]" />
      <div className="mt-3 h-2 w-2/5 rounded-sm bg-[var(--border)]" />
      <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
      <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
      <div className="h-1 w-3/4 rounded-sm bg-[var(--border-light)]" />
      <div className="mt-3 h-2 w-1/3 rounded-sm bg-[var(--border)]" />
      <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
      <div className="h-1 w-5/6 rounded-sm bg-[var(--border-light)]" />
    </div>
  );
}

function TemplateModal({
  isOpen,
  onClose,
  onSelect,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateHtml: string | null, name: string) => void;
  onImport: (html: string, plainText: string) => void;
}) {
  const [showImport, setShowImport] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex shrink-0 items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            {showImport && (
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)]">
              {showImport ? 'Import Your Resume' : 'Get Started'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); setShowImport(false); }}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
        {showImport ? (
          <div>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              Upload a file or paste your resume content. We&apos;ll extract it so you can optimize it for any job description.
            </p>
            <ResumeUpload onResumeExtracted={onImport} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Import Your Resume */}
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--accent-subtle)] bg-[var(--accent-light)]/50 p-6 text-center transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-light)] hover:shadow-[var(--shadow-sm)]"
            >
              <svg className="mb-3 h-10 w-10 text-[var(--accent)] transition-colors group-hover:text-[var(--accent-hover)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-semibold text-[var(--accent)]">
                Import Your Resume
              </span>
              <span className="mt-1 text-xs text-[var(--text-tertiary)]">
                Upload PDF/DOCX or paste content
              </span>
            </button>

            {/* Start Blank */}
            <button
              type="button"
              onClick={() => onSelect(null, 'Untitled Resume')}
              className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] p-6 text-center transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] hover:shadow-[var(--shadow-sm)]"
            >
              <svg className="mb-3 h-10 w-10 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                Start Blank
              </span>
              <span className="mt-1 text-xs text-[var(--text-muted)]">
                Begin with a basic structure
              </span>
            </button>

            {/* Templates */}
            {RESUME_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.html, template.name)}
                className="group flex flex-col items-start rounded-lg border border-[var(--border)] p-6 text-left transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-light)] transition-colors group-hover:bg-[var(--accent-subtle)]">
                  <svg className="h-5 w-5 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                  {template.name}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const resumes = useResumeStore((state) => state.resumes);
  const createResume = useResumeStore((state) => state.createResume);
  const deleteResume = useResumeStore((state) => state.deleteResume);
  const setActiveResume = useResumeStore((state) => state.setActiveResume);

  const { totalAvailable, credits, isLoading: creditsLoading } = useUserCredits();

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleCreateResume = useCallback(
    (templateHtml: string | null, name: string) => {
      if (templateHtml) {
        createResume(name, templateHtml);
      } else {
        createResume(name);
      }
      setShowTemplateModal(false);
      router.push('/editor');
    },
    [createResume, router]
  );

  const handleImportResume = useCallback(
    (html: string, _plainText: string) => {
      createResume('Imported Resume', html);
      setShowTemplateModal(false);
      router.push('/editor');
    },
    [createResume, router]
  );

  const handleEditResume = useCallback(
    (id: string) => {
      setActiveResume(id);
      router.push('/editor');
    },
    [setActiveResume, router]
  );

  const handleDeleteResume = useCallback(
    (id: string) => {
      deleteResume(id);
      setDeleteConfirmId(null);
    },
    [deleteResume]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                {/* JacqBots logo mark */}
                <Image src="/jacqbots-logo.png" alt="JacqBots" width={40} height={40} className="rounded-lg" />
                <div>
                  <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    Resume Bot
                  </h1>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                    by JacqBots
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Optimize your resume, land more interviews
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Credits remaining */}
              {!creditsLoading && credits && (
                <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5">
                  <svg className="h-3.5 w-3.5 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.894.553l1.448 2.897 2.897 1.448a1 1 0 010 1.788l-2.897 1.448-1.448 2.897a1 1 0 01-1.788 0l-1.448-2.897L6.763 8.34a1 1 0 010-1.788l2.897-1.448L11.106 2.21A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-primary)]">
                    {totalAvailable}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {totalAvailable === 1 ? 'fix left' : 'fixes left'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Resume
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Your Resumes */}
        <section className="mb-14">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)]">
            Your Resumes
          </h2>

          {resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center shadow-[var(--shadow-sm)]">
              <div className="relative mb-6">
                {/* Stacked paper effect */}
                <div className="absolute -left-2 top-1 h-20 w-16 rotate-[-6deg] rounded border border-[var(--border-light)] bg-[var(--surface-raised)]" />
                <div className="absolute -right-1 top-0.5 h-20 w-16 rotate-[4deg] rounded border border-[var(--border-light)] bg-[var(--surface-raised)]" />
                <div className="relative h-20 w-16 rounded border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
                  <div className="space-y-1 p-2">
                    <div className="h-1.5 w-3/4 rounded-sm bg-[var(--border)]" />
                    <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
                    <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
                    <div className="h-1 w-2/3 rounded-sm bg-[var(--border-light)]" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded-sm bg-[var(--border)]" />
                    <div className="h-1 w-full rounded-sm bg-[var(--border-light)]" />
                  </div>
                </div>
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)]">
                Create Your First Resume
              </h3>
              <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
                Choose a professional template or import your existing resume. Our AI will help you optimize it for ATS systems.
              </p>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-paper)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                >
                  {/* Paper preview area */}
                  <div className="relative border-b border-[var(--border-light)] bg-[var(--surface-raised)]">
                    <PaperPreview />
                    {/* ATS Score stamp */}
                    <div className="absolute right-3 top-3">
                      <ATSScoreStamp score={resume.lastATSScore} />
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                        {resume.title}
                      </h3>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                        Edited {formatDate(resume.updatedAt)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditResume(resume.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.793 8.793-3.828.707.707-3.828 8.793-8.793z" />
                        </svg>
                        Edit
                      </button>

                      {deleteConfirmId === resume.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteResume(resume.id)}
                            className="rounded-md bg-[var(--danger)] px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(resume.id)}
                          className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--danger)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
                          title="Delete resume"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* New Resume card */}
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="group flex min-h-[240px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-sm)]"
              >
                <svg className="mb-2 h-8 w-8 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-sm font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                  New Resume
                </span>
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="mb-14">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)]">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push('/scam-check')}
              className="group flex items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--gold-light)] transition-colors group-hover:bg-[var(--gold-subtle)]">
                <svg className="h-5 w-5 text-[var(--gold)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Check a Job for Scams
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  Verify if a job posting is legitimate before applying. Our AI analyzes red flags and company credibility.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push('/cover-letter')}
              className="group flex items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] transition-colors group-hover:bg-[var(--accent-subtle)]">
                <svg className="h-5 w-5 text-[var(--accent)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Generate a Cover Letter
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  Create a tailored cover letter from your resume and a job description. Choose professional or conversational tone.
                </p>
              </div>
            </button>
          </div>
        </section>
      </div>

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleCreateResume}
        onImport={handleImportResume}
      />
    </div>
  );
}
