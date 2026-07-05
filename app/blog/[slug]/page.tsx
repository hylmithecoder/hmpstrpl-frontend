import type { Metadata } from 'next';
import BlogDetailPage from "@/app/pages/BlogDetail";
import { apiFetch, mockPosts, getPostThumbnail, type Post } from '@/app/utils/api';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const fallbackPost = mockPosts.find((p: Post) => p.slug === slug) || mockPosts[0];
  const post = await apiFetch<Post>(`/posts/${slug}`, fallbackPost);
  const thumbnail = getPostThumbnail(post);
  
  return {
    title: `${post.title} - HMPS TRPL Polmed`,
    description: post.excerpt || `Baca selengkapnya mengenai ${post.title} di portal resmi HMPS TRPL Politeknik Negeri Medan.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Baca selengkapnya mengenai ${post.title} di portal resmi HMPS TRPL Politeknik Negeri Medan.`,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.user?.name || 'Admin'],
      images: thumbnail ? [{ url: thumbnail, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Baca selengkapnya mengenai ${post.title} di portal resmi HMPS TRPL Politeknik Negeri Medan.`,
      images: thumbnail ? [thumbnail] : [],
    },
  };
}

export default function Page({ params }: RouteParams) {
  return <BlogDetailPage params={params} />;
}