'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useResumeStore } from '@/hooks/useResumeStore';
import JobDescriptionInput from '@/components/job/JobDescriptionInput';
import ResumeEditor from '@/components/editor/ResumeEditor';
import ResumeUpload from '@/components/editor/ResumeUpload';
import ATSScorePanel from '@/components/scoring/ATSScorePanel';
import DidYouKnowCard from '@/components/did-you-know/DidYouKnowCard';

function PanelToggle({
  side,
  isOpen,
  onClick,
}: {
  side: 'left' | 'right';
  isOpen: boolean;
  onClick: () => void;
}) {
  const isLeft = side === 'left';

  return (
    <button
      type="button"
      onClick={onClick}
      title={isOpen ? `Collapse ${side} panel` : `Expand ${side} panel`}
      className="hidden h-8 w-5 items-center justify-center rounded-sm bg-[var(--border)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--border-strong)] hover:text-[var(--text-secondary)] md:flex"
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isLeft ? (
          isOpen ? (
            <path d="M7.5 2.5l-4 3.5 4 3.5" />
          ) : (
            <path d="M4.5 2.5l4 3.5-4 3.5" />
          )
        ) : isOpen ? (
          <path d="M4.5 2.5l4 3.5-4 3.5" />
        ) : (
          <path d="M7.5 2.5l-4 3.5 4 3.5" />
        )}
      </svg>
    </button>
  );
}

type MobileTab = 'job' | 'editor' | 'score';

export default function EditorPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const resumes = useResumeStore((state) => state.resumes);
  const activeResumeId = useResumeStore((state) => state.activeResumeId);
  const createResume = useResumeStore((state) => state.createResume);
  const updateResumeContent = useResumeStore(
    (state) => state.updateResumeContent
  );
  const getActiveResume = useResumeStore((state) => state.getActiveResume);

  const activeResume = getActiveResume();

  // Wait for client-side hydration before rendering to avoid SSR mismatch
  // (Zustand persist loads from localStorage only on client)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Auto-create a resume if none exists
  useEffect(() => {
    if (!hasMounted) return;
    if (resumes.length === 0) {
      createResume('My Resume');
    } else if (!activeResumeId && resumes.length > 0) {
      useResumeStore.getState().setActiveResume(resumes[0].id);
    }
  }, [hasMounted, resumes.length, activeResumeId, createResume, resumes]);

  const handleEditorUpdate = useCallback(
    (html: string, plainText: string) => {
      updateResumeContent(html, plainText);
    },
    [updateResumeContent]
  );

  // Handle resume file upload - replace editor content with uploaded resume
  const handleResumeUploaded = useCallback(
    (html: string, plainText: string) => {
      updateResumeContent(html, plainText);
      setShowUploadModal(false);
      setEditorKey((k) => k + 1);
    },
    [updateResumeContent]
  );

  // Handle AI resume fix - receives new HTML from the fixer
  const handleResumeFix = useCallback(
    (newHTML: string) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHTML;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      updateResumeContent(newHTML, plainText);
      setEditorKey((k) => k + 1);
    },
    [updateResumeContent]
  );

  const handleTitleSubmit = useCallback(() => {
    setIsEditingTitle(false);
    if (titleInputRef.current && activeResume) {
      const newTitle = titleInputRef.current.value.trim();
      if (newTitle.length > 0) {
        useResumeStore.setState((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === activeResume.id ? { ...r, title: newTitle } : r
          ),
        }));
      }
    }
  }, [activeResume]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleExport = useCallback(async () => {
    if (!activeResume) return;

    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeResume.title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.5}h1{font-size:1.8rem;margin-bottom:0.5rem}h2{font-size:1.3rem;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:1.5rem}h3{font-size:1.1rem;margin-top:1rem}ul{padding-left:1.5rem}li{margin-bottom:4px}</style></head><body>${activeResume.html}</body></html>`,
      ],
      { type: 'text/html' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeResume.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeResume]);

  if (!hasMounted || !activeResume) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <a
            href="/"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
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
            <span className="hidden sm:inline">Dashboard</span>
          </a>
          <div className="hidden h-4 w-px bg-[var(--border-strong)] sm:block" />
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              defaultValue={activeResume.title}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="min-w-0 rounded border border-[var(--accent)] bg-[var(--surface)] px-2 py-0.5 text-sm font-medium text-[var(--text-primary)] outline-none ring-1 ring-[var(--accent)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="min-w-0 truncate rounded px-2 py-0.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--background)]"
              title="Click to rename"
            >
              {activeResume.title}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)] sm:px-3"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] sm:px-3"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar - only visible on small screens */}
      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--surface)] md:hidden">
        {([
          { key: 'job' as const, label: 'Job', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { key: 'editor' as const, label: 'Resume', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { key: 'score' as const, label: 'ATS Score', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mobileTab === tab.key
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'text-[var(--text-tertiary)]'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--surface)] p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upload Your Resume</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-sm text-[var(--text-tertiary)]">
              Upload your existing resume and we&apos;ll extract the content so you can optimize it for any job description.
            </p>
            <ResumeUpload onResumeExtracted={handleResumeUploaded} />
          </div>
        </div>
      )}

      {/* ─── MOBILE LAYOUT ─── */}
      {/* Job Description - mobile */}
      <div className={`flex-1 overflow-y-auto md:hidden ${mobileTab === 'job' ? '' : 'hidden'}`}>
        <div className="flex h-full flex-col bg-[var(--surface)]">
          <div className="flex-1 overflow-hidden">
            <JobDescriptionInput />
          </div>
          <div className="border-t border-[var(--border)] p-3">
            <DidYouKnowCard />
          </div>
        </div>
      </div>

      {/* Resume Editor - mobile */}
      <div className={`flex-1 overflow-hidden md:hidden ${mobileTab === 'editor' ? 'flex flex-col' : 'hidden'}`}>
        <ResumeEditor
          key={editorKey}
          content={activeResume.html}
          onUpdate={handleEditorUpdate}
        />
      </div>

      {/* ATS Score - mobile */}
      <div className={`flex-1 overflow-y-auto md:hidden ${mobileTab === 'score' ? '' : 'hidden'}`}>
        <div className="bg-[var(--surface)]">
          <ATSScorePanel onResumeFix={handleResumeFix} />
        </div>
      </div>

      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* Left panel: Job description input */}
        {leftPanelOpen && (
          <div className="flex w-[320px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Job Description
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <JobDescriptionInput />
            </div>

            {/* AI Resume Tips */}
            <div className="border-t border-[var(--border)] p-3">
              <DidYouKnowCard />
            </div>
          </div>
        )}

        {/* Left toggle */}
        <div className="flex items-center">
          <PanelToggle
            side="left"
            isOpen={leftPanelOpen}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          />
        </div>

        {/* Center: Resume editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ResumeEditor
            key={editorKey}
            content={activeResume.html}
            onUpdate={handleEditorUpdate}
          />
        </div>

        {/* Right toggle */}
        <div className="flex items-center">
          <PanelToggle
            side="right"
            isOpen={rightPanelOpen}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          />
        </div>

        {/* Right panel: ATS Score */}
        {rightPanelOpen && (
          <div className="flex w-[350px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                ATS Analysis
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ATSScorePanel onResumeFix={handleResumeFix} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
