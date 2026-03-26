'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeMagicLinkSignIn } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        await completeMagicLinkSignIn();
        router.replace('/');
      } catch {
        setError('Failed to complete sign-in. The link may have expired.');
      }
    }

    handleCallback();
  }, [completeMagicLinkSignIn, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="mx-4 max-w-sm rounded-xl bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-lg)]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-light)]">
            <svg className="h-6 w-6 text-[var(--danger)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sign-In Failed</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        <span className="text-sm">Signing you in...</span>
      </div>
    </div>
  );
}
