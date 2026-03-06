'use client';

import { useState } from 'react';
import { useJobStore } from '@/hooks/useJobStore';

type InputMode = 'text' | 'url';

export default function JobDescriptionInput() {
  const [mode, setMode] = useState<InputMode>('text');
  const { jobDescription, jobUrl, setJobDescription, setJobUrl, clearJob } =
    useJobStore();

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const hasContent = mode === 'text' ? jobDescription.length > 0 : jobUrl.length > 0;

  async function handleFetchUrl() {
    if (!jobUrl.trim()) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract content from URL');
      }

      if (!data.content || data.content.trim().length === 0) {
        throw new Error('No content could be extracted from this URL. Try pasting the job description manually.');
      }

      // Populate the text area and switch to text mode
      setJobDescription(data.content);
      setMode('text');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setExtractError(message);
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            mode === 'text'
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            mode === 'url'
              ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Paste URL
        </button>
      </div>

      {/* Input area */}
      <div className="flex flex-1 flex-col p-3">
        {mode === 'text' ? (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="flex-1 resize-none rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-gray-400 outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => {
                setJobUrl(e.target.value);
                setExtractError(null);
              }}
              placeholder="https://example.com/job-posting"
              disabled={isExtracting}
              className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-gray-400 outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleFetchUrl}
              disabled={isExtracting || !jobUrl.trim()}
              className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Extracting...
                </>
              ) : (
                'Fetch Job Description'
              )}
            </button>

            {extractError && (
              <p className="text-xs text-[var(--danger)]">{extractError}</p>
            )}
          </div>
        )}

        {/* Clear button */}
        {hasContent && (
          <button
            type="button"
            onClick={() => {
              clearJob();
              setExtractError(null);
            }}
            className="mt-3 self-start rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-secondary)]"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
