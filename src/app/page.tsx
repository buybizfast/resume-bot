'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { blogPosts } from '@/lib/blog-posts';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'ATS Resume Scorer',
      desc: 'Paste any job description and get an instant match score, keyword gaps, and rewrite suggestions tailored to that exact role.',
      badge: '1 free scan',
      badgeStyle: { background: '#FDF6E7', color: '#C4952C', border: '1px solid #F5E6C4' },
      href: '/dashboard',
      cta: 'Check my score',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: 'Cover Letter Generator',
      desc: 'Get a tailored cover letter from your resume and the job description in under 60 seconds. Professional or conversational tone.',
      badge: '1 free letter',
      badgeStyle: { background: '#FDF6E7', color: '#C4952C', border: '1px solid #F5E6C4' },
      href: '/cover-letter',
      cta: 'Generate a letter',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      title: 'Job Scam Detector',
      desc: 'AI analyzes any job posting for red flags: fake domains, payment requests, urgency tactics. Always free, no login needed.',
      badge: 'Always free',
      badgeStyle: { background: '#E8F5F0', color: '#0B7A5E', border: '1px solid #D0EDE4' },
      href: '/scam-check',
      cta: 'Check a posting',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatRobot { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .fade-up { animation: fadeUp 0.65s ease forwards; opacity: 0; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.15s; } .d3 { animation-delay: 0.28s; }
        .d4 { animation-delay: 0.4s; } .d5 { animation-delay: 0.52s; }
        .robot-float { animation: floatRobot 4s ease-in-out infinite; }
        .feat-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .feat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(27,43,75,0.1); }
        .blog-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .blog-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(27,43,75,0.08); }
        .hero-grid { display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: center; }
        @media (max-width: 720px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-robot-col { order: -1; text-align: center; }
          .hero-robot-col img { max-width: 220px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/jacqbots-logo.png" alt="JacqBots" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg leading-tight text-[var(--text-primary)]">Resume Bot</div>
              <div className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--accent)]">by JacqBots</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/blog" className="hidden px-4 py-2 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] sm:block">Blog</Link>
            <Link href="/scam-check" className="hidden px-4 py-2 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] sm:block">Scam Check</Link>
            <Link href="/dashboard" className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="hero-grid">

          {/* Left */}
          <div>
            <div className={mounted ? 'fade-up d1' : 'opacity-0'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8F5F0', border: '1px solid #D0EDE4', borderRadius: 100, padding: '5px 14px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B7A5E', flexShrink: 0 }} />
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)]" style={{ whiteSpace: 'nowrap' }}>
                AI-Powered Career Tools. Free to Start.
              </span>
            </div>

            <h1 className={`font-[family-name:var(--font-display)] text-[var(--text-primary)] ${mounted ? 'fade-up d2' : 'opacity-0'}`} style={{ fontSize: 'clamp(40px, 5.5vw, 68px)', lineHeight: 1.06, marginBottom: 24 }}>
              Land your next job.<br />
              <em className="text-[var(--accent)]">With AI on your side.</em>
            </h1>

            <p className={`text-[var(--text-secondary)] ${mounted ? 'fade-up d3' : 'opacity-0'}`} style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 460, marginBottom: 40 }}>
              Resume Bot scores your resume against any job description, generates tailored cover letters, and catches fake job postings before you waste time applying.
            </p>

            <div className={`${mounted ? 'fade-up d4' : 'opacity-0'}`} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Start for Free
              </Link>
              <Link href="/scam-check" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-raised)] hover:shadow-sm">
                Check a Job for Scams
              </Link>
            </div>

            <div className={`${mounted ? 'fade-up d5' : 'opacity-0'}`} style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
              {[{ value: '100%', label: 'Free to start' }, { value: '3', label: 'AI-powered tools' }, { value: '$0', label: 'Credit card needed' }].map(({ value, label }) => (
                <div key={label}>
                  <div className="font-[family-name:var(--font-mono)] text-2xl font-medium text-[var(--accent)]">{value}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: robot */}
          <div className="hero-robot-col" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Decorative warm glow behind robot */}
            <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(11,122,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div className="robot-float" style={{ position: 'relative', zIndex: 1 }}>
              <Image
                src="/jacqbots-logo.png"
                alt="JacqBots AI Robot"
                width={400}
                height={400}
                style={{ width: '100%', maxWidth: 360, height: 'auto' }}
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <div className="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Three Tools. One Bot.</div>
          <h2 className="font-[family-name:var(--font-display)] text-[var(--text-primary)]" style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
            Everything you need to job search smarter
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
            Stop sending resumes into the void. Get real feedback, real letters, and real protection from scams.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link key={f.title} href={f.href} className="feat-card group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-paper)] transition-all" style={{ textDecoration: 'none' }}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                  {f.icon}
                </div>
                <span className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-wide" style={f.badgeStyle}>
                  {f.badge}
                </span>
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg text-[var(--text-primary)]">{f.title}</h3>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{f.desc}</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                {f.cta}
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Simple Process</div>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--text-primary)]" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
              From resume to interviews in three steps
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { step: '01', title: 'Upload your resume', body: 'Import a PDF, DOCX, paste your content, or pick a template. We extract everything automatically.' },
              { step: '02', title: 'Paste the job description', body: 'Add the job posting URL or paste the description. Our AI maps your resume to the role in real time.' },
              { step: '03', title: 'Optimize and apply', body: 'Get your ATS score, apply keyword suggestions, generate a cover letter, and submit with confidence.' },
            ].map((item, i) => (
              <div key={item.step} className="relative rounded-lg p-7">
                {i < 2 && (
                  <div className="absolute right-0 top-1/3 hidden h-px w-6 bg-gradient-to-r from-[var(--border)] to-transparent sm:block" />
                )}
                <div className="mb-4 font-[family-name:var(--font-mono)] text-5xl font-medium text-[var(--border)]">{item.step}</div>
                <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Career Advice</div>
              <h2 className="font-[family-name:var(--font-display)] text-[var(--text-primary)]" style={{ fontSize: 'clamp(22px, 2.5vw, 32px)' }}>
                Learn the game before you play it
              </h2>
            </div>
            <Link href="/blog" className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1">
              All articles
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-paper)]" style={{ textDecoration: 'none' }}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[var(--accent)]">
                    {post.category}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">{post.readTime}</span>
                </div>
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-base leading-snug text-[var(--text-primary)]">{post.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Free to Start</div>
          <h2 className="font-[family-name:var(--font-display)] text-[var(--text-primary)]" style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', lineHeight: 1.1, marginBottom: 16 }}>
            Your next job is closer<br />
            <em className="text-[var(--accent)]">than you think.</em>
          </h2>
          <p className="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
            One free ATS score. One free cover letter. Zero credit cards required.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)]">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
                <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" />
                <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-display)] text-sm text-[var(--text-primary)]">Resume Bot</span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">by JacqBots</span>
          </div>
          <div className="flex gap-6">
            {[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scam Check', href: '/scam-check' }, { label: 'Cover Letter', href: '/cover-letter' }, { label: 'Blog', href: '/blog' }].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]">{label}</Link>
            ))}
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">© 2026 JacqBots</div>
        </div>
      </footer>
    </div>
  );
}
