'use client';

import { useState } from 'react';

interface KeywordChipsProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

const INITIAL_VISIBLE = 8;

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6l2.5 2.5 4.5-4.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  );
}

function KeywordSection({
  title,
  keywords,
  variant,
}: {
  title: string;
  keywords: string[];
  variant: 'matched' | 'missing';
}) {
  const [expanded, setExpanded] = useState(false);

  const isMatched = variant === 'matched';
  const visibleKeywords = expanded
    ? keywords
    : keywords.slice(0, INITIAL_VISIBLE);
  const hasMore = keywords.length > INITIAL_VISIBLE;

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">{title}</h4>
      {keywords.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          {isMatched
            ? 'No keywords matched yet.'
            : 'No missing keywords found.'}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visibleKeywords.map((keyword) => (
              <span
                key={keyword}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isMatched
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'bg-[var(--danger-light)] text-[var(--danger)]'
                }`}
              >
                {isMatched ? <CheckIcon /> : <XIcon />}
                {keyword}
              </span>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]"
            >
              {expanded
                ? 'Show less'
                : `Show all (${keywords.length - INITIAL_VISIBLE} more)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function KeywordChips({
  matchedKeywords,
  missingKeywords,
}: KeywordChipsProps) {
  return (
    <div className="space-y-4">
      <KeywordSection
        title="Matched Keywords"
        keywords={matchedKeywords}
        variant="matched"
      />
      <KeywordSection
        title="Missing Keywords"
        keywords={missingKeywords}
        variant="missing"
      />
    </div>
  );
}
