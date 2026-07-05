import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Hubungi Kami - HMPS TRPL Politeknik Negeri Medan',
  description: 'Formulir kontak dan informasi layanan administrasi Himpunan Mahasiswa Program Studi Teknologi Rekayasa Perangkat Lunak Politeknik Negeri Medan.',
  keywords: ['Kontak TRPL', 'HMPS TRPL Polmed', 'Sekretariat TRPL', 'Hubungi HMPS TRPL'],
  openGraph: {
    title: 'Hubungi Kami - HMPS TRPL Politeknik Negeri Medan',
    description: 'Kirim pesan atau pertanyaan secara langsung ke sekretariat pengurus HMPS TRPL Politeknik Negeri Medan.',
    type: 'website',
  }
};

export default function Page() {
  return <ContactForm />;
}
