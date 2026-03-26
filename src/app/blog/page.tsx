import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Advice Blog | Resume Bot by JacqBots',
  description: 'ATS resume tips, cover letter guides, and job scam warnings from the team at JacqBots. Practical career advice that actually helps you get hired.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
                    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" />
                    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  Resume Bot
                </span>
              </Link>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--text-primary)]">
                Career Advice
              </h1>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Practical tips on resumes, cover letters, and staying safe in your job search
              </p>
            </div>
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)]"
            >
              Try Resume Bot Free
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-wide text-[var(--accent)]">
                      {post.category}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                      {post.readTime}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="mb-2 font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    Read article
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-[var(--accent-subtle)] bg-[var(--accent-light)] p-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">
            Ready to put this advice into action?
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Check your ATS score, generate a cover letter, and scan job postings for scams — all free.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)]"
            >
              Start for Free
            </Link>
            <Link
              href="/scam-check"
              className="rounded-lg border border-[var(--border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-raised)]"
            >
              Check a Job for Scams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
