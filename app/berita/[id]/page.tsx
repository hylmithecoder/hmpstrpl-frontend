import type { Metadata } from 'next';
import BeritaDetailPage from '@/app/pages/BeritaDetail';
import { fetchInstagramMedia, instagramCover, instagramTitle, instagramExcerpt } from '@/app/utils/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const { media } = await fetchInstagramMedia(id);

  if (!media) {
    return {
      title: 'Berita tidak ditemukan - HMPS TRPL Polmed',
      description: 'Konten Instagram yang Anda cari sudah tidak tersedia.',
    };
  }

  const title = instagramTitle(media.caption, 90);
  const description =
    instagramExcerpt(media.caption, 180) ||
    'Kabar terbaru dari akun Instagram resmi HMPS TRPL Politeknik Negeri Medan.';
  const cover = instagramCover(media);

  return {
    title: `${title} - Berita HMPS TRPL Polmed`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: media.timestamp,
      images: cover ? [{ url: cover, width: 1080, height: 1350 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : [],
    },
  };
}

export default function Page({ params }: RouteParams) {
  return <BeritaDetailPage params={params} />;
}
