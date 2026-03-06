'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ParsedJobDescription } from '@/types/job';

interface JobState {
  jobDescription: string;
  jobUrl: string;
  parsedJob: ParsedJobDescription | null;
  setJobDescription: (text: string) => void;
  setJobUrl: (url: string) => void;
  setParsedJob: (job: ParsedJobDescription) => void;
  clearJob: () => void;
}

export const useJobStore = create<JobState>()(
  persist(
    (set) => ({
      jobDescription: '',
      jobUrl: '',
      parsedJob: null,

      setJobDescription: (text: string): void => {
        set({ jobDescription: text });
      },

      setJobUrl: (url: string): void => {
        set({ jobUrl: url });
      },

      setParsedJob: (job: ParsedJobDescription): void => {
        set({ parsedJob: job });
      },

      clearJob: (): void => {
        set({
          jobDescription: '',
          jobUrl: '',
          parsedJob: null,
        });
      },
    }),
    {
      name: 'job-store',
    }
  )
);
