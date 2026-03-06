'use client';

import { useMemo } from 'react';
import { getRecommendedBoards, JOB_BOARDS, type JobBoard } from '@/lib/job-boards-data';

interface JobBoardListProps {
  careerField?: string;
}

function TrustBadge({ score }: { score: JobBoard['trustScore'] }) {
  if (score === 'high') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        High Trust
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Use Caution
    </span>
  );
}

export default function JobBoardList({ careerField }: JobBoardListProps) {
  const boards = useMemo(() => {
    if (careerField && careerField.trim().length > 0) {
      return getRecommendedBoards(careerField);
    }
    // When no career field is given, show all high-trust boards
    return JOB_BOARDS.filter((b) => b.trustScore === 'high');
  }, [careerField]);

  if (boards.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">No job boards found for this field.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <div
          key={board.name}
          className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{board.name}</h3>
              <TrustBadge score={board.trustScore} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
              {board.description}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {board.categories.slice(0, 4).map((cat) => (
                <span
                  key={cat}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500"
                >
                  {cat}
                </span>
              ))}
              {board.categories.length > 4 && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  +{board.categories.length - 4}
                </span>
              )}
            </div>
          </div>
          <a
            href={board.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            Visit
            <svg
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7l6 6M13 7v6H7" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  );
}
