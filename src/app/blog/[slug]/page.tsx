import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPost, getAllSlugs } from '@/lib/blog-posts';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Resume Bot by JacqBots`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      {/* JSON-LD schema injection */}
      {post.schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify((schema as { data: object }).data) }}
        />
      ))}

      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)]">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
                    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" />
                    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  Resume Bot
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/blog" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                  ← All Articles
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden sm:block rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[var(--accent-hover)]"
                >
                  Try Free
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Article */}
        <main className="mx-auto max-w-3xl px-6 py-12">
          {/* Meta */}
          <div className="mb-6 flex items-center gap-3 flex-wrap">
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

          {/* Title */}
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--text-primary)] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            {post.excerpt}
          </p>

          {/* Divider */}
          <div className="my-8 border-t border-[var(--border)]" />

          {/* Content */}
          <div
            className="prose prose-sm sm:prose max-w-none
              prose-headings:font-[family-name:var(--font-display)] prose-headings:text-[var(--text-primary)] prose-headings:font-normal
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
              prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed prose-p:my-4
              prose-strong:text-[var(--text-primary)] prose-strong:font-semibold
              prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
              prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)]
              prose-li:my-1.5"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-12 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]"
              >
                #{tag.replace(/ /g, '-')}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-xl border border-[var(--accent-subtle)] bg-[var(--accent-light)] p-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--text-primary)]">
              Put this into practice with Resume Bot
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              ATS scoring, cover letter generation, and job scam detection — free to start, no credit card required.
            </p>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)]"
              >
                Start for Free
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Read more articles →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
