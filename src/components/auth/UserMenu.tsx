'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from './LoginModal';

export default function UserMenu() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--border)]" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Sign In
        </button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  const initial = (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase();
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white transition-opacity hover:opacity-90"
        title={displayName}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          initial
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--border-light)] px-4 py-3">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </p>
            {user.email && (
              <p className="truncate text-xs text-[var(--text-tertiary)]">
                {user.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              setShowDropdown(false);
              await signOut();
              router.push('/');
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--background)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
