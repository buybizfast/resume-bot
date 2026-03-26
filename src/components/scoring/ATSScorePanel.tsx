'use client';

import { useState, useCallback } from 'react';
import { useATSScore } from '@/hooks/useATSScore';
import { useResumeStore } from '@/hooks/useResumeStore';
import { useJobStore } from '@/hooks/useJobStore';
import { stripMarkdown } from '@/lib/text-utils';
import ScoreGauge from '@/components/scoring/ScoreGauge';
import KeywordChips from '@/components/scoring/KeywordChips';
import SuggestionsList from '@/components/scoring/SuggestionsList';
import LoginModal from '@/components/auth/LoginModal';
import PaywallModal from '@/components/payments/PaywallModal';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import type { ATSScoreResult, Suggestion } from '@/types/scoring';

interface ATSScorePanelProps {
  onResumeFix?: (newHTML: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  keywordMatch: 'Keyword Match',
  sectionStructure: 'Section Structure',
  formattingQuality: 'Formatting Quality',
  experienceRelevance: 'Experience Relevance',
  measurableImpact: 'Measurable Impact',
  completeness: 'Completeness',
};

function CategoryBar({
  label,
  score,
  maxScore,
}: {
  label: string;
  score: number;
  maxScore: number;
}) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-[130px] shrink-0 text-xs text-[var(--text-secondary)]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--background)]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor:
              percentage >= 75
                ? '#0B7A5E'
                : percentage >= 50
                  ? '#C4952C'
                  : percentage >= 25
                    ? '#D47B2A'
                    : '#C23B3B',
          }}
        />
      </div>
      <span className="w-[48px] shrink-0 text-right text-xs tabular-nums text-[var(--text-tertiary)]">
        {Math.round(score * 10) / 10}/{maxScore}
      </span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)]" />
      <span className="text-xs text-[var(--text-tertiary)]">Calculating score...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
        <svg
          className="h-8 w-8 text-[var(--text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        Paste a job description to see your ATS score
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Your resume will be scored against the job requirements
      </p>
    </div>
  );
}

function ScoreBreakdown({ breakdown }: { breakdown: ATSScoreResult['breakdown'] }) {
  const categories = Object.entries(breakdown) as Array<
    [keyof ATSScoreResult['breakdown'], ATSScoreResult['breakdown'][keyof ATSScoreResult['breakdown']]]
  >;

  return (
    <div className="space-y-2.5">
      {categories.map(([key, categoryScore]) => (
        <CategoryBar
          key={key}
          label={CATEGORY_LABELS[key] ?? key}
          score={categoryScore.score}
          maxScore={categoryScore.maxScore}
        />
      ))}
    </div>
  );
}

function FixResumeSection({
  suggestions,
  onResumeFix,
}: {
  suggestions: Suggestion[];
  onResumeFix: (newHTML: string) => void;
}) {
  const { user, getIdToken } = useAuth();
  const { canFix, refreshCredits } = useUserCredits();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{ changes: string[] } | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    () => {
      // Auto-select all high and medium priority suggestions
      const set = new Set<number>();
      suggestions.forEach((s, i) => {
        if (s.priority === 'high' || s.priority === 'medium') set.add(i);
      });
      return set;
    }
  );

  const toggleSuggestion = useCallback((index: number) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
  }, [suggestions]);

  const deselectAll = useCallback(() => {
    setSelectedSuggestions(new Set());
  }, []);

  const handleFixResume = useCallback(async () => {
    // ─── Auth Gate ───
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // ─── Credit Gate ───
    if (!canFix) {
      setShowPaywallModal(true);
      return;
    }

    const selected = suggestions.filter((_, i) => selectedSuggestions.has(i));
    if (selected.length === 0) return;

    setIsFixing(true);
    setFixError(null);
    setFixResult(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication failed');

      const resumeState = useResumeStore.getState();
      const activeResume = resumeState.resumes.find(
        (r) => r.id === resumeState.activeResumeId
      );
      if (!activeResume) throw new Error('No active resume');

      const jobDescription = useJobStore.getState().jobDescription;

      const res = await fetch('/api/fix-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeHTML: activeResume.html,
          resumePlainText: activeResume.plainText,
          resumeTitle: activeResume.title,
          jobDescription,
          suggestions: selected.map(
            (s) => `[${s.priority.toUpperCase()}] ${s.category}: ${s.message} - ${s.action}`
          ),
        }),
      });

      // Handle 402 — needs payment
      if (res.status === 402) {
        setShowPaywallModal(true);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      if (data.revisedHTML) {
        onResumeFix(data.revisedHTML);
        setFixResult({ changes: data.changes || ['Resume has been updated'] });
        // Refresh credits after successful fix
        refreshCredits();
      } else {
        throw new Error('No revised HTML returned');
      }
    } catch (err) {
      setFixError(err instanceof Error ? err.message : 'Failed to fix resume');
    } finally {
      setIsFixing(false);
    }
  }, [suggestions, selectedSuggestions, onResumeFix, user, canFix, getIdToken, refreshCredits]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-[var(--accent-subtle)] bg-[var(--accent-light)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
        <h3 className="text-sm font-bold text-[var(--accent)]">Fix My Resume</h3>
      </div>

      <p className="mb-3 text-xs text-[var(--accent)]">
        Select the suggestions below and our AI will automatically rewrite your resume to address them. Your job history stays the same - we just improve the content.
      </p>

      {/* Select/Deselect All */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-[10px] font-medium text-[var(--accent)] underline hover:text-[var(--accent-hover)]"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="text-[10px] font-medium text-[var(--accent)] underline hover:text-[var(--accent-hover)]"
        >
          Deselect all
        </button>
      </div>

      {/* Suggestion checkboxes */}
      <div className="mb-4 max-h-48 space-y-1.5 overflow-y-auto">
        {suggestions.map((s, i) => (
          <label
            key={i}
            className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
              selectedSuggestions.has(i)
                ? 'border-[var(--accent)] bg-[var(--surface)]'
                : 'border-transparent bg-[var(--accent-light)] opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedSuggestions.has(i)}
              onChange={() => toggleSuggestion(i)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border-strong)] text-[var(--accent)] accent-[var(--accent)]"
            />
            <span className="leading-relaxed text-[var(--text-primary)]">
              <span
                className={`mr-1 inline-block rounded px-1 py-0.5 text-[9px] font-bold leading-none ${
                  s.priority === 'high'
                    ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                    : s.priority === 'medium'
                      ? 'bg-[var(--gold-light)] text-[var(--gold)]'
                      : 'bg-[var(--accent-light)] text-[var(--accent)]'
                }`}
              >
                {s.priority.toUpperCase()}
              </span>
              {s.message}
            </span>
          </label>
        ))}
      </div>

      {/* Fix Button */}
      <button
        type="button"
        onClick={handleFixResume}
        disabled={isFixing || selectedSuggestions.size === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isFixing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Rewriting your resume...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Fix Resume ({selectedSuggestions.size} suggestion{selectedSuggestions.size !== 1 ? 's' : ''})
          </>
        )}
      </button>

      {/* Fix Error */}
      {fixError && (
        <div className="mt-3 rounded-md bg-[var(--danger-light)] p-2.5 text-xs text-[var(--danger)]">
          {fixError}
        </div>
      )}

      {/* Fix Success */}
      {fixResult && (
        <div className="mt-3 rounded-md bg-[var(--surface)] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Resume updated!
          </p>
          <ul className="space-y-1">
            {fixResult.changes.map((change, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                • {stripMarkdown(change)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Auth & Payment Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Sign in to use AI-powered resume fixes"
      />
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        onCreditsUpdated={refreshCredits}
      />
    </div>
  );
}

export default function ATSScorePanel({ onResumeFix }: ATSScorePanelProps) {
  const { score, isCalculating } = useATSScore();

  if (!score && !isCalculating) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="space-y-6 p-4">
        {/* Loading indicator */}
        {isCalculating && <LoadingSpinner />}

        {score && (
          <>
            {/* Score Gauge */}
            <div className="flex justify-center">
              <ScoreGauge score={score.totalScore} />
            </div>

            {/* FIX MY RESUME - The proactive section */}
            {onResumeFix && score.suggestions.length > 0 && (
              <FixResumeSection
                suggestions={score.suggestions}
                onResumeFix={onResumeFix}
              />
            )}

            {/* Score Breakdown */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Score Breakdown
              </h3>
              <ScoreBreakdown breakdown={score.breakdown} />
            </div>

            {/* Keywords */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Keywords
              </h3>
              <KeywordChips
                matchedKeywords={score.matchedKeywords}
                missingKeywords={score.missingKeywords}
              />
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Suggestions
              </h3>
              <SuggestionsList suggestions={score.suggestions} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
