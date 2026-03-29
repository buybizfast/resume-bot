'use client';
import { useState, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';

export function useBlotato() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const callAPI = useCallback(async (endpoint: string, body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const optimize = useCallback((resumeText: string, jobDescription: string) => {
    return callAPI('/api/optimize', { resumeText, jobDescription });
  }, [callAPI]);

  const generateCoverLetter = useCallback((resumeText: string, jobDescription: string, companyName: string, tone: string) => {
    return callAPI('/api/cover-letter', { resumeText, jobDescription, companyName, tone });
  }, [callAPI]);

  const getDidYouKnow = useCallback((jobTitle: string, careerField: string, resumeSnippet?: string) => {
    return callAPI('/api/did-you-know', { jobTitle, careerField, resumeSnippet: resumeSnippet || '' });
  }, [callAPI]);

  const checkScam = useCallback((companyName: string, jobTitle?: string, jobUrl?: string, jobText?: string) => {
    return callAPI('/api/scam-check', { companyName, jobTitle, jobUrl, jobText });
  }, [callAPI]);

  return { loading, error, optimize, generateCoverLetter, getDidYouKnow, checkScam };
}
