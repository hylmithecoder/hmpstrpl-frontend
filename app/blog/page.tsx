import type { Metadata } from 'next';
import BlogIndexPage from "../pages/Blog";

export const metadata: Metadata = {
  title: "Berita & Artikel - HMPS TRPL Polmed",
  description: "Dapatkan info kelulusan alumni, berita kegiatan organisasi, dan artikel pemrograman dari mahasiswa Teknologi Rekayasa Perangkat Lunak Politeknik Negeri Medan.",
  keywords: ["Berita TRPL", "Wisuda TRPL", "Artikel Pemrograman Polmed", "Blog HMPS TRPL"],
};

export default function Page() {
  return <BlogIndexPage />;
}