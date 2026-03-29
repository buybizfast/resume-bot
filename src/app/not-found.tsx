import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6">
      <div className="text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
          404
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          This page doesn&apos;t exist. Head back to the dashboard to keep optimizing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
