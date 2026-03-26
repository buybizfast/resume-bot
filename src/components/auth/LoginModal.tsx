'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginModal({ isOpen, onClose, message }: LoginModalProps) {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setError('');
    setIsLoadingGoogle(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setIsLoadingEmail(true);
    try {
      await signInWithMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch {
      setError('Failed to send sign-in link. Please check your email and try again.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 mx-4 w-full max-w-sm rounded-xl bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">
            Sign In
          </h2>
          {message && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
          )}
          {!message && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Sign in to save your progress and unlock AI features
            </p>
          )}
        </div>

        {magicLinkSent ? (
          /* Magic link sent confirmation */
          <div className="rounded-lg bg-[var(--accent-light)] p-4 text-center">
            <svg className="mx-auto mb-2 h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3 className="text-sm font-semibold text-[var(--accent)]">Check your email</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              We sent a sign-in link to <strong>{email}</strong>. Click the link in your email to sign in.
            </p>
            <button
              type="button"
              onClick={() => { setMagicLinkSent(false); setEmail(''); }}
              className="mt-3 text-xs font-medium text-[var(--accent)] underline hover:no-underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoadingGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--surface-raised)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
            >
              {isLoadingGoogle ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-muted)]">or</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {/* Email Magic Link */}
            <form onSubmit={handleMagicLink}>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={isLoadingEmail || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isLoadingEmail ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                )}
                Send Sign-In Link
              </button>
            </form>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 text-center text-xs text-[var(--danger)]">{error}</p>
        )}

        {/* Footer */}
        <p className="mt-5 text-center text-[10px] text-[var(--text-muted)]">
          No passwords needed. Quick and secure.
        </p>
      </div>
    </div>
  );
}
