'use client';

import { useState } from 'react';
import type { Suggestion } from '@/types/scoring';

interface SuggestionsListProps {
  suggestions: Suggestion[];
}

const PRIORITY_CONFIG = {
  high: {
    dotColor: 'bg-[var(--danger)]',
    badgeText: 'HIGH',
    badgeBg: 'bg-[var(--danger-light)] text-[var(--danger)]',
  },
  medium: {
    dotColor: 'bg-[var(--gold)]',
    badgeText: 'MEDIUM',
    badgeBg: 'bg-[var(--gold-light)] text-[var(--gold)]',
  },
  low: {
    dotColor: 'bg-[var(--accent)]',
    badgeText: 'LOW',
    badgeBg: 'bg-[var(--accent-light)] text-[var(--accent)]',
  },
} as const;

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const config = PRIORITY_CONFIG[suggestion.priority];

  return (
    <div className="flex gap-2.5 rounded-md border border-[var(--border-light)] bg-[var(--surface)] p-3">
      {/* Priority dot */}
      <div
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${config.dotColor}`}
      />

      <div className="min-w-0 flex-1">
        {/* Priority badge + Category */}
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${config.badgeBg}`}
          >
            {config.badgeText}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {suggestion.category}
          </span>
        </div>

        {/* Message */}
        <p className="text-xs leading-relaxed text-[var(--text-primary)]">
          {suggestion.message}
        </p>

        {/* Action */}
        <p className="mt-1 text-xs italic leading-relaxed text-[var(--text-tertiary)]">
          {suggestion.action}
        </p>
      </div>
    </div>
  );
}

export default function SuggestionsList({ suggestions }: SuggestionsListProps) {
  const [showLow, setShowLow] = useState(false);

  const highSuggestions = suggestions.filter((s) => s.priority === 'high');
  const mediumSuggestions = suggestions.filter((s) => s.priority === 'medium');
  const lowSuggestions = suggestions.filter((s) => s.priority === 'low');

  if (suggestions.length === 0) {
    return (
      <p className="text-center text-xs text-[var(--text-muted)]">
        No suggestions at this time.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* High priority */}
      {highSuggestions.map((s, i) => (
        <SuggestionItem key={`high-${i}`} suggestion={s} />
      ))}

      {/* Medium priority */}
      {mediumSuggestions.map((s, i) => (
        <SuggestionItem key={`medium-${i}`} suggestion={s} />
      ))}

      {/* Low priority (collapsible) */}
      {lowSuggestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowLow(!showLow)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
          >
            <svg
              className={`h-3 w-3 shrink-0 transition-transform ${
                showLow ? 'rotate-90' : ''
              }`}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 2.5l4 3.5-4 3.5" />
            </svg>
            {lowSuggestions.length} low priority suggestion
            {lowSuggestions.length !== 1 ? 's' : ''}
          </button>

          {showLow && (
            <div className="mt-2 space-y-2">
              {lowSuggestions.map((s, i) => (
                <SuggestionItem key={`low-${i}`} suggestion={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
