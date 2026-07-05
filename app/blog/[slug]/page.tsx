import type { Metadata } from 'next';
import BlogDetailPage from "@/app/pages/BlogDetail";
import { apiFetch, mockPosts, type Post } from '@/app/utils/api';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const fallbackPost = mockPosts.find((p: Post) => p.slug === slug) || mockPosts[0];
  const post = await apiFetch<Post>(`/posts/${slug}`, fallbackPost);
  
  return {
    title: `${post.title} - HMPS TRPL Polmed`,
    description: post.excerpt || `Baca selengkapnya mengenai ${post.title} di portal resmi HMPS TRPL Politeknik Negeri Medan.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Baca selengkapnya mengenai ${post.title} di portal resmi HMPS TRPL Politeknik Negeri Medan.`,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.user?.name || 'Admin'],
    }
  };
}

export default function Page({ params }: RouteParams) {
  return <BlogDetailPage params={params} />;
}