import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://resumebots.co';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/editor`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/cover-letter`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/scam-check`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
