import type { Metadata } from 'next';
import BeritaPage from '../pages/Berita';
import { fetchInstagramCollabLinks } from '../utils/api';

export const metadata: Metadata = {
  title: 'Berita HMPS TRPL Polmed - Feed Instagram Resmi',
  description:
    'Kabar terbaru, pengumuman, dan dokumentasi kegiatan HMPS TRPL Politeknik Negeri Medan langsung dari akun Instagram resmi himpunan.',
  keywords: ['Berita HMPS TRPL', 'Instagram HMPS TRPL', 'Kegiatan TRPL Polmed', 'Pengumuman HMPS'],
};

export default async function Page() {
  // Curated collab permalinks live behind the admin settings endpoint, so they
  // are read here on the server and handed to the client page as plain data.
  const collabLinks = await fetchInstagramCollabLinks();
  return <BeritaPage collabLinks={collabLinks} />;
}
