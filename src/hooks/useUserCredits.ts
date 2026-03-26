'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Credits {
  freeFixesUsed: number;
  freeFixesLimit: number;
  fixesRemaining: number;
  totalPaidFixes: number;
}

export function useUserCredits() {
  const { user, getIdToken } = useAuth();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      return;
    }

    setIsLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/user/credits', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getIdToken]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const hasFreeFix = credits ? credits.freeFixesUsed < credits.freeFixesLimit : false;
  const hasPaidFix = credits ? credits.fixesRemaining > 0 : false;
  const canFix = hasFreeFix || hasPaidFix;

  const totalAvailable = credits
    ? (credits.freeFixesLimit - credits.freeFixesUsed) + credits.fixesRemaining
    : 0;

  return {
    credits,
    isLoading,
    hasFreeFix,
    hasPaidFix,
    canFix,
    totalAvailable,
    refreshCredits: fetchCredits,
  };
}
