'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CouponInputProps {
  onSuccess?: (fixesGranted: number) => void;
}

export default function CouponInput({ onSuccess }: CouponInputProps) {
  const { getIdToken } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = await getIdToken();
      if (!token) {
        setError('Please sign in first.');
        return;
      }

      const res = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid coupon code');
        return;
      }

      setSuccess(`${data.fixesGranted} fix${data.fixesGranted === 1 ? '' : 'es'} added!`);
      setCode('');
      onSuccess?.(data.fixesGranted);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="mb-2 text-center text-xs text-[var(--text-tertiary)]">
        Have a coupon code?
      </p>
      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); setSuccess(''); }}
          placeholder="ENTER CODE"
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            'Apply'
          )}
        </button>
      </form>
      {error && <p className="mt-1.5 text-center text-[11px] text-[var(--danger)]">{error}</p>}
      {success && <p className="mt-1.5 text-center text-[11px] font-semibold text-[var(--accent)]">{success}</p>}
    </div>
  );
}
