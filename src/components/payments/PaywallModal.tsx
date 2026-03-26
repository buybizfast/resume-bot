'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CouponInput from '@/components/coupon/CouponInput';

const PRICING_TIERS = [
  {
    id: 'single',
    name: '1 Fix',
    price: '$3.99',
    perFix: '$3.99/fix',
    fixes: 1,
    badge: null,
  },
  {
    id: 'triple',
    name: '3 Fixes',
    price: '$9.99',
    perFix: '$3.33/fix',
    fixes: 3,
    badge: 'Most Popular',
  },
  {
    id: 'bulk',
    name: '10 Fixes',
    price: '$24.99',
    perFix: '$2.50/fix',
    fixes: 10,
    badge: 'Best Value',
  },
];

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: () => void;
}

export default function PaywallModal({ isOpen, onClose, onCreditsUpdated }: PaywallModalProps) {
  const { getIdToken } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePurchase = async (tierId: string) => {
    setError('');
    setLoadingTier(tierId);

    try {
      const token = await getIdToken();
      if (!token) {
        setError('Please sign in first.');
        return;
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]">
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-light)]">
            <svg className="h-6 w-6 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">
            Get More Fixes
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            You&apos;ve used your free fix. Choose a plan to continue optimizing your resume.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col items-center rounded-lg border p-4 transition-all ${
                tier.badge === 'Most Popular'
                  ? 'border-[var(--accent)] bg-[var(--accent-light)]/50 shadow-[var(--shadow-md)]'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]'
              }`}
            >
              {tier.badge && (
                <span className={`absolute -top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  tier.badge === 'Most Popular'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--gold)] text-white'
                }`}>
                  {tier.badge}
                </span>
              )}
              <span className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {tier.name}
              </span>
              <span className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">
                {tier.price}
              </span>
              <span className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                {tier.perFix}
              </span>
              <button
                type="button"
                onClick={() => handlePurchase(tier.id)}
                disabled={!!loadingTier}
                className={`mt-3 w-full rounded-md px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                  tier.badge === 'Most Popular'
                    ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)]'
                    : 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                {loadingTier === tier.id ? (
                  <div className="mx-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                ) : (
                  'Buy'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="border-t border-[var(--border-light)] pt-4">
          <CouponInput
            onSuccess={() => {
              onCreditsUpdated?.();
              onClose();
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-center text-xs text-[var(--danger)]">{error}</p>
        )}
      </div>
    </div>
  );
}
