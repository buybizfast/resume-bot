'use client';

import { useState, useEffect, useRef } from 'react';
import { useResumeStore } from '@/hooks/useResumeStore';
import { useJobStore } from '@/hooks/useJobStore';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateATSScore } from '@/lib/ats-scorer';
import type { ATSScoreResult } from '@/types/scoring';

export function useATSScore(): {
  score: ATSScoreResult | null;
  isCalculating: boolean;
} {
  const [score, setScore] = useState<ATSScoreResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const prevScoreRef = useRef<number | null>(null);

  const getActiveResume = useResumeStore((state) => state.getActiveResume);
  const updateATSScore = useResumeStore((state) => state.updateATSScore);
  const jobDescription = useJobStore((state) => state.jobDescription);

  const activeResume = getActiveResume();
  const resumePlainText = activeResume?.plainText ?? '';
  const resumeHTML = activeResume?.html ?? '';
  const resumeId = activeResume?.id ?? '';

  const debouncedPlainText = useDebounce(resumePlainText, 500);
  const debouncedJobDescription = useDebounce(jobDescription, 500);

  useEffect(() => {
    if (!debouncedJobDescription.trim()) {
      setScore(null);
      setIsCalculating(false);
      return;
    }

    if (!debouncedPlainText.trim()) {
      setScore(null);
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);

    // Use a microtask to avoid blocking the UI thread
    const timeoutId = setTimeout(() => {
      const result = calculateATSScore(
        resumeHTML,
        debouncedPlainText,
        debouncedJobDescription
      );

      setScore(result);
      setIsCalculating(false);

      // Update the store only if the total score changed
      if (resumeId && result.totalScore !== prevScoreRef.current) {
        prevScoreRef.current = result.totalScore;
        updateATSScore(resumeId, result.totalScore);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    debouncedPlainText,
    debouncedJobDescription,
    resumeHTML,
    resumeId,
    updateATSScore,
  ]);

  return { score, isCalculating };
}
