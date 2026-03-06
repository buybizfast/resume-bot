'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Resume } from '@/types/resume';

const DEFAULT_RESUME_HTML = `<h1>Your Name</h1>
<p>email@example.com | (555) 555-5555 | City, State</p>
<h2>Summary</h2>
<p>Experienced professional with a proven track record of delivering results.</p>
<h2>Experience</h2>
<h3>Job Title - Company Name</h3>
<p><em>Month Year - Present</em></p>
<ul>
  <li>Accomplished X as measured by Y, resulting in Z</li>
</ul>
<h2>Education</h2>
<h3>Degree - University Name</h3>
<p><em>Graduation Year</em></p>
<h2>Skills</h2>
<p>Skill 1, Skill 2, Skill 3</p>`;

function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent?.trim() ?? '';
}

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  createResume: (title?: string, template?: string) => string;
  updateResumeContent: (html: string, plainText: string) => void;
  deleteResume: (id: string) => void;
  setActiveResume: (id: string) => void;
  updateATSScore: (id: string, score: number) => void;
  getActiveResume: () => Resume | undefined;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,

      createResume: (title?: string, template?: string): string => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const html = template ?? DEFAULT_RESUME_HTML;
        const plainText = htmlToPlainText(html);

        const newResume: Resume = {
          id,
          title: title ?? 'Untitled Resume',
          html,
          plainText,
          createdAt: now,
          updatedAt: now,
          lastATSScore: null,
        };

        set((state) => ({
          resumes: [...state.resumes, newResume],
          activeResumeId: id,
        }));

        return id;
      },

      updateResumeContent: (html: string, plainText: string): void => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;

        const now = new Date().toISOString();

        set((state) => ({
          resumes: state.resumes.map((resume) =>
            resume.id === activeResumeId
              ? { ...resume, html, plainText, updatedAt: now }
              : resume
          ),
        }));
      },

      deleteResume: (id: string): void => {
        set((state) => {
          const filtered = state.resumes.filter((r) => r.id !== id);
          const newActiveId =
            state.activeResumeId === id
              ? filtered.length > 0
                ? filtered[0].id
                : null
              : state.activeResumeId;

          return {
            resumes: filtered,
            activeResumeId: newActiveId,
          };
        });
      },

      setActiveResume: (id: string): void => {
        const { resumes } = get();
        const exists = resumes.some((r) => r.id === id);
        if (!exists) return;

        set({ activeResumeId: id });
      },

      updateATSScore: (id: string, score: number): void => {
        set((state) => ({
          resumes: state.resumes.map((resume) =>
            resume.id === id
              ? { ...resume, lastATSScore: score, updatedAt: new Date().toISOString() }
              : resume
          ),
        }));
      },

      getActiveResume: (): Resume | undefined => {
        const { resumes, activeResumeId } = get();
        if (!activeResumeId) return undefined;
        return resumes.find((r) => r.id === activeResumeId);
      },
    }),
    {
      name: 'resume-store',
    }
  )
);
