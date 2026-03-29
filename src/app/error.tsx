'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6">
      <div className="text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Error
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          An unexpected error occurred. Try again or head back to the dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-[var(--border-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)]"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
