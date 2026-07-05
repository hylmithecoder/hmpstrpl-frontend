import "dotenv/config"

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  bio?: string;
  userimg?: string;
}

export interface Post {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'TRASH';
  featured_img?: string;
  published_at: string;
  views: number;
  category?: Category;
  tags?: Tag[];
  user?: User;
}

export interface Position {
  id: number;
  name: string;
}

export interface Division {
  id: number;
  name: string;
  alias: string;
  members?: Member[];
}

export interface ManagementYear {
  id: number;
  start_year: number;
  end_year: number;
  slug: string; // derived yearSlug e.g. "2023-2024"
  divisions?: Division[];
}

export interface Member {
  uuid: string;
  name: string;
  nim?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo?: string;
  bio?: string;
  position?: Position;
  division?: Omit<Division, 'members'>;
  managementyear?: Omit<ManagementYear, 'divisions'>;
}

export interface PageData {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  featured_img?: string;
  published_at: string;
  views: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const API_BASE_URL = 'http://localhost:5000/api/v1';
export const API_ORIGIN = process.env.API_URL || 'http://localhost:5000';

// One section of a post body. Post.body stores JSON: [{ "content": "<p>…</p>", "file": ["url", …] }]
export interface PostSection {
  content: string;
  file: string[];
}

// Parses a post body into sections; returns null for legacy plain-text bodies
export function parsePostBody(body: string): PostSection[] | null {
  if (!body || !body.trim().startsWith('[')) return null;
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((s) => s && typeof s === 'object')
      .map((s) => ({
        content: typeof s.content === 'string' ? s.content : '',
        file: Array.isArray(s.file) ? s.file.filter((f: unknown): f is string => typeof f === 'string') : []
      }));
  } catch {
    return null;
  }
}

// Always returns editable sections: parses JSON bodies, or converts a legacy
// plain-text body into one section of simple HTML (paragraphs + ##/### headings)
export function postBodyToSections(body: string): PostSection[] {
  const parsed = parsePostBody(body);
  if (parsed && parsed.length > 0) return parsed;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = body.split('\n\n').map(p => {
    const t = p.trim();
    if (!t) return '';
    if (t.startsWith('### ')) return `<h3>${esc(t.slice(4))}</h3>`;
    if (t.startsWith('## ')) return `<h2>${esc(t.slice(3))}</h2>`;
    return `<p>${esc(t).replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return [{ content: html || '<p></p>', file: [] }];
}

// Post thumbnail ("manifest"): explicit featured_img wins, otherwise the first
// image of the first section that has one — used as cover in listings & detail
export function getPostThumbnail(post: { body?: string; featured_img?: string }): string | null {
  if (post.featured_img) return post.featured_img;
  const sections = parsePostBody(post.body || '');
  if (!sections) return null;
  for (const section of sections) {
    if (section.file.length > 0) return section.file[0];
  }
  return null;
}

// Strips <script> blocks, dangerous embed tags, inline event handlers, and javascript: URLs.
// Applied both when saving from the editor and when rendering stored HTML.
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '')
    .replace(/<\/?(script|iframe|object|embed|form|link|meta)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, '$1=$2#$2');
}

// True when raw HTML contains constructs the editor forbids outright
export function containsForbiddenScript(html: string): boolean {
  return /<script\b|javascript:|\son\w+\s*=/i.test(html);
}

// Media library files are served from the storage server by filename
export function resolveMediaUrl(filename: string): string {
  if (filename.startsWith('http') || filename.startsWith('data:') || filename.startsWith('blob:')) return filename;
  return `${API_ORIGIN}/storage/img/media/${filename}`;
}

// Resolves member photo filenames to full storage URLs
export function resolvePhoto(photo?: string): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('blob:')) return photo;
  return `${API_ORIGIN}/storage/img/members/${photo}`;
}

// Robust generic API fetcher with automatic mock fallback if request fails.
// Pass { noStore: true } for data that must always be fresh (e.g. org structure).
export async function apiFetch<T>(path: string, fallbackData: T, opts?: { noStore?: boolean }): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...(opts?.noStore ? { cache: 'no-store' as const } : { next: { revalidate: 60 } }),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`API request to ${path} failed with status ${res.status}. Using mock fallback.`);
      return fallbackData;
    }

    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : fallbackData;
  } catch (error) {
    console.warn(`Failed to connect to local API at ${API_BASE_URL}${path}:`, error, `. Using mock fallback.`);
    return fallbackData;
  }
}

// Submits a contact inquiry to the backend
export async function submitContact(body: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return {
      success: json.success ?? res.ok,
      message: json.message ?? (res.ok ? 'Message sent successfully.' : 'Failed to send message.'),
    };
  } catch (error) {
    console.error('Failed to submit contact message:', error);
    // Simulate successful local submission if backend is offline so the user can test the UI flow
    return {
      success: true,
      message: '[Local Simulation] Message submitted successfully! (Laravel API is offline)',
    };
  }
}

// Fallback Mock Data Providers
export const mockCategories: Category[] = [
  { id: 1, name: 'Berita & Pengumuman', description: 'Kabar terkini dan info penting seputar HMPS TRPL.' },
  { id: 2, name: 'Kegiatan Mahasiswa', description: 'Liputan dokumentasi acara, workshop, dan kompetisi.' },
  { id: 3, name: 'Artikel & Edukasi', description: 'Artikel ilmiah, tips pemrograman, dan rekayasa perangkat lunak.' }
];

export const mockTags: Tag[] = [
  { id: 1, name: 'React', slug: 'react', posts_count: 5 },
  { id: 2, name: 'Next.js', slug: 'nextjs', posts_count: 3 },
  { id: 3, name: 'Laravel', slug: 'laravel', posts_count: 4 },
  { id: 4, name: 'Workshop', slug: 'workshop', posts_count: 2 },
  { id: 5, name: 'Polmed', slug: 'polmed', posts_count: 6 }
];

export const mockUser: User = {
  id: 1,
  name: 'Admin HMPS',
  email: 'admin@hmpstrpl.com',
  username: 'admin',
  bio: 'Akun resmi kepengurusan Himpunan Mahasiswa Program Studi TRPL.',
  userimg: ''
};

export const mockPosts: Post[] = [
  {
    id: 1,
    uuid: 'post-1',
    title: 'Pendaftaran Pengurus HMPS TRPL Periode 2024/2025 Resmi Dibuka!',
    slug: 'pendaftaran-pengurus-hmps-trpl-2024-2025',
    excerpt: 'Saatnya berkontribusi untuk jurusan! Pendaftaran calon anggota baru kepengurusan resmi dibuka mulai hari ini.',
    body: `Saatnya berkontribusi untuk kemajuan program studi kita! Himpunan Mahasiswa Program Studi Teknologi Rekayasa Perangkat Lunak (HMPS TRPL) Politeknik Negeri Medan resmi membuka pendaftaran kepengurusan untuk periode 2024/2025.

Bagi rekan-rekan mahasiswa aktif TRPL tingkat 1 dan tingkat 2 yang berdedikasi, ingin meningkatkan soft-skill kepemimpinan, kerja tim, serta memperluas relasi di bidang rekayasa perangkat lunak, silakan daftarkan diri Anda segera.

### Divisi yang Dibuka:
1. **Divisi Kestari (Sekretariat & Rumah Tangga)**
2. **Divisi Humas & Pengabdian Masyarakat**
3. **Divisi IPTEK & Pengembangan Karakter**
4. **Divisi Kreatif & Multimedia**

### Persyaratan Umum:
- Mahasiswa aktif prodi TRPL Polmed semester 2 atau 4.
- Memiliki IPK minimal 3.00.
- Berkomitmen tinggi untuk meluangkan waktu demi kepengurusan selama satu periode.

Informasi lebih lanjut dapat diakses melalui sekretariat HMPS TRPL di Gedung Jurusan Elektro Polmed.`,
    status: 'PUBLISHED',
    published_at: '2026-07-01T08:00:00Z',
    views: 124,
    category: mockCategories[0],
    tags: [mockTags[3], mockTags[4]],
    user: mockUser
  },
  {
    id: 2,
    uuid: 'post-2',
    title: 'Sukses Gelar Bootcamp Web Development Bersama Praktisi Industri',
    slug: 'bootcamp-web-development-bersama-praktisi',
    excerpt: 'HMPS TRPL sukses mengadakan bootcamp intensif web development modern menggunakan Next.js dan Tailwind CSS.',
    body: `HMPS TRPL kembali mengadakan acara edukasi bergengsi. Kali ini, kami sukses menggelar Bootcamp Web Development dengan tema "Building Modern Web Application with Next.js and Tailwind CSS". Acara ini mengundang Kak Hylmi, seorang Software Architect di Meta Open Source, sebagai pembicara utama.

Bootcamp yang berlangsung selama dua hari ini diikuti oleh lebih dari 50 peserta dari internal maupun eksternal prodi TRPL Politeknik Negeri Medan.

### Materi yang Dipelajari:
- Pendahuluan Arsitektur Jamstack & Server-Side Rendering
- Routing di Next.js App Router
- Desain antarmuka cepat dengan Tailwind CSS
- Pengenalan Astryx Design Token System

Rencananya, kegiatan serupa akan terus diadakan secara berkala oleh Divisi IPTEK untuk mewadahi minat mahasiswa dalam mendalami dunia industri teknologi modern.`,
    status: 'PUBLISHED',
    published_at: '2026-06-25T09:30:00Z',
    views: 245,
    category: mockCategories[1],
    tags: [mockTags[0], mockTags[1], mockTags[3]],
    user: mockUser
  },
  {
    id: 3,
    uuid: 'post-3',
    title: 'Tips Memilih Stack Pemrograman yang Tepat untuk Proyek Akhir',
    slug: 'tips-memilih-stack-pemrograman-proyek-akhir',
    excerpt: 'Panduan lengkap bagi mahasiswa semester akhir TRPL dalam memilih stack teknologi yang sesuai untuk aplikasi tugas akhir.',
    body: `Memasuki semester akhir, mahasiswa TRPL dihadapkan pada kewajiban menyusun Proyek Akhir (PA). Salah satu tantangan terbesar di awal adalah menentukan stack teknologi pemrograman yang tepat.

Pemilihan teknologi ini tidak hanya berpengaruh pada durasi pengerjaan, melainkan juga performa produk akhir serta ketersediaan dokumentasi pemecahan masalah.

### 1. Sesuaikan dengan Kebutuhan Fungsional
Jangan gunakan arsitektur microservices yang rumit jika aplikasi Anda hanya berupa sistem informasi warung makan (POS) skala kecil. Pilihlah monolitik modular seperti Laravel atau Next.js monorepo demi menghemat waktu setup.

### 2. Pertimbangkan Learning Curve
Gunakan bahasa pemrograman yang sudah Anda kuasai. Jika Anda mahir JavaScript/TypeScript selama perkuliahan, gunakan ekosistem Node/Next/Nest. Jika lebih terbiasa dengan PHP, ekosistem Laravel + Livewire/Inertia adalah pilihan terbaik.

### 3. Dukungan Komunitas & Dokumentasi
Pastikan framework yang Anda gunakan memiliki komunitas aktif. Ini krusial ketika Anda menemui bug atau error tak terduga di tengah pengerjaan.`,
    status: 'PUBLISHED',
    published_at: '2026-06-18T10:15:00Z',
    views: 89,
    category: mockCategories[2],
    tags: [mockTags[1], mockTags[2]],
    user: mockUser
  }
];

export const mockManagementYears: ManagementYear[] = [
  { id: 1, start_year: 2024, end_year: 2025, slug: '2024-2025' },
  { id: 2, start_year: 2023, end_year: 2024, slug: '2023-2024' }
];

export const mockStrukturOrganisasi: Record<string, ManagementYear> = {
  '2024-2025': {
    id: 1,
    start_year: 2024,
    end_year: 2025,
    slug: '2024-2025',
    divisions: [
      {
        id: 1,
        name: 'Pengurus Harian (PH)',
        alias: 'ph',
        members: [
          {
            uuid: 'm-1',
            name: 'Hylmi',
            nim: '2105102030',
            position: { id: 1, name: 'Ketua Umum' },
            bio: 'Mahasiswa TRPL angkatan 2022. Memiliki antusiasme tinggi di bidang rekayasa perangkat lunak dan manajemen tim.',
            photo: ''
          },
          {
            uuid: 'm-2',
            name: 'Farhan',
            nim: '2105102041',
            position: { id: 2, name: 'Wakil Ketua Umum' },
            bio: 'Aktif mendampingi program kerja eksternal dan menjaga koordinasi antar divisi.',
            photo: ''
          },
          {
            uuid: 'm-3',
            name: 'Alya Syafira',
            nim: '2105102012',
            position: { id: 3, name: 'Sekretaris Umum' },
            bio: 'Bertanggung jawab penuh atas administrasi persuratan, notulensi rapat, dan arsip data organisasi.',
            photo: ''
          },
          {
            uuid: 'm-4',
            name: 'Nabila Putri',
            nim: '2105102019',
            position: { id: 4, name: 'Bendahara Umum' },
            bio: 'Mengelola keuangan, anggaran kas, serta transparansi pelaporan sirkulasi dana HMPS.',
            photo: ''
          }
        ]
      },
      {
        id: 2,
        name: 'Divisi IPTEK & Kurikulum',
        alias: 'iptek',
        members: [
          {
            uuid: 'm-5',
            name: 'Rahmat Hidayat',
            nim: '2205102005',
            position: { id: 5, name: 'Kepala Divisi' },
            bio: 'Fokus pada pengembangan riset teknologi, bootcamp, dan pelatihan teknis mahasiswa.',
            photo: ''
          },
          {
            uuid: 'm-6',
            name: 'Cindy Clarissa',
            nim: '2205102034',
            position: { id: 6, name: 'Anggota Divisi' },
            bio: 'Mengurus publikasi karya software buatan mahasiswa dan mentor sesi programming.',
            photo: ''
          },
          {
            uuid: 'm-7',
            name: 'Aditia Pratama',
            nim: '2205102078',
            position: { id: 6, name: 'Anggota Divisi' },
            bio: 'Membantu persiapan sarana laboratorium dan kelancaran program workshop bulanan.',
            photo: ''
          }
        ]
      },
      {
        id: 3,
        name: 'Divisi Humas & Pengabdian',
        alias: 'humas',
        members: [
          {
            uuid: 'm-8',
            name: 'Dimas Syahputra',
            nim: '2105102099',
            position: { id: 5, name: 'Kepala Divisi' },
            bio: 'Menjadi jembatan komunikasi antara HMPS TRPL dengan instansi kampus, alumni, serta masyarakat luas.',
            photo: ''
          },
          {
            uuid: 'm-9',
            name: 'Zahra Amelia',
            nim: '2205102015',
            position: { id: 6, name: 'Anggota Divisi' },
            bio: 'Berperan aktif menyusun agenda pengabdian sosial dan kuesioner aspirasi mahasiswa.',
            photo: ''
          }
        ]
      }
    ]
  },
  '2023-2024': {
    id: 2,
    start_year: 2023,
    end_year: 2024,
    slug: '2023-2024',
    divisions: [
      {
        id: 1,
        name: 'Pengurus Harian (PH)',
        alias: 'ph',
        members: [
          {
            uuid: 'm-10',
            name: 'Fahri Alamsyah',
            nim: '2005102045',
            position: { id: 1, name: 'Ketua Umum' },
            bio: 'Pemimpin tangguh periode sebelumnya yang meletakkan fondasi digitalisasi situs HMPS.',
            photo: ''
          },
          {
            uuid: 'm-11',
            name: 'Dinda Lestari',
            nim: '2005102022',
            position: { id: 3, name: 'Sekretaris' },
            bio: 'Mempelopori kearsipan digital terpadu.',
            photo: ''
          }
        ]
      }
    ]
  }
};

export const mockPages: Record<string, PageData> = {
  'sejarah-hmps': {
    id: 1,
    uuid: 'page-1',
    title: 'Sejarah HMPS TRPL',
    slug: 'sejarah-hmps',
    body: `### Awal Mula Berdirinya Himpunan

Himpunan Mahasiswa Program Studi Teknologi Rekayasa Perangkat Lunak Politeknik Negeri Medan (HMPS TRPL) didirikan pada tahun 2021 seiring dengan dibukanya program studi Diploma IV TRPL di bawah naungan Jurusan Teknik Elektro.

Pendirian himpunan ini diinisiasi oleh sekelompok mahasiswa angkatan pertama bersama dosen-dosen pembina prodi dengan visi mendirikan sebuah organisasi mahasiswa yang adaptif, inovatif, serta fokus menyalurkan bakat minat mahasiswa di bidang rekayasa perangkat lunak (software engineering).

### Perkembangan Kepengurusan
- **Tahun 2021-2022**: Kepengurusan transisi difokuskan pada perumusan Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) serta program pengenalan dasar organisasi.
- **Tahun 2023-2024**: HMPS mulai mengadakan kolaborasi eksternal berupa bootcamp pemrograman bekerjasama dengan industri nasional.
- **Tahun 2024-Sekarang**: Digitalisasi administrasi secara penuh serta peluncuran platform showcase karya mahasiswa.`,
    published_at: '2026-06-01T00:00:00Z',
    views: 120
  },
  'visi-misi': {
    id: 2,
    uuid: 'page-2',
    title: 'Visi & Misi HMPS TRPL',
    slug: 'visi-misi',
    body: `### Visi
Menjadikan Himpunan Mahasiswa Program Studi Teknologi Rekayasa Perangkat Lunak (HMPS TRPL) Politeknik Negeri Medan sebagai pusat pengembangan akademik, kepemimpinan, dan kreativitas mahasiswa yang unggul, berintegritas, serta berdaya saing global dalam ekosistem teknologi digital.

### Misi
1. **Mengakselerasi Potensi Akademik & Praktis**: Menyelenggarakan kegiatan kajian teknologi, workshop coding intensif, dan bootcamp industri guna mendukung kapasitas pemrograman mahasiswa.
2. **Membangun Kepemimpinan yang Solutif**: Membina mentalitas kepemimpinan dan manajemen organisasi yang adaptif terhadap perubahan iklim industri teknologi.
3. **Mewadahi Solidaritas & Pengabdian**: Mengoptimalkan peran eksternal berupa aksi pengabdian masyarakat berbasis pemanfaatan perangkat lunak solutif (social software).
4. **Mendorong Kolaborasi Lintas Disiplin**: Memfasilitasi pameran/showcase produk inovasi ciptaan mahasiswa TRPL untuk dipasarkan ke inkubator bisnis kampus dan umum.`,
    published_at: '2026-06-01T00:00:00Z',
    views: 180
  }
};

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface AdminStats {
  totalPosts: number;
  totalMembers: number;
  totalDivisions: number;
  totalInbox: number;
  activePeriod: string;
}

const ADMIN_HEADERS = {
  'X-User-Author': 'Hylmi',
  'X-Kampus-User': 'Polmed',
  'Accept': 'application/json',
};

export async function apiAdminFetch<T>(path: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: ADMIN_HEADERS,
      cache: 'no-store', // Always get fresh admin data
    });

    if (!res.ok) {
      console.warn(`Admin API request to ${path} failed with status ${res.status}. Using mock fallback.`);
      return fallbackData;
    }

    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : fallbackData;
  } catch (error) {
    console.warn(`Failed to connect to local Admin API at ${API_BASE_URL}${path}:`, error, `. Using mock fallback.`);
    return fallbackData;
  }
}

export const mockInbox: ContactMessage[] = [
  {
    id: 1,
    name: 'Ahmad Faisal',
    email: 'ahmad@example.com',
    phone: '081265437890',
    subject: 'Pertanyaan Program Kerja Pengabdian',
    message: 'Halo pengurus HMPS TRPL, saya mahasiswa tingkat 1 ingin menanyakan apakah ada rencana kegiatan pengabdian masyarakat dalam waktu dekat yang membutuhkan relawan mahasiswa tingkat 1? Terima kasih.',
    created_at: '2026-07-04T12:00:00Z'
  },
  {
    id: 2,
    name: 'Sarah Siregar',
    email: 'sarah@siregar.org',
    phone: '085376541212',
    subject: 'Kerjasama Media Partner Event IT',
    message: 'Kami dari Himpunan Teknik Komputer berniat menyelenggarakan Pekan IT Nasional bulan depan. Apakah HMPS TRPL bersedia menjadi media partner untuk mempublikasikan poster lomba kami? Proposal kerjasama telah kami siapkan.',
    created_at: '2026-07-03T15:30:00Z'
  }
];

export const mockSettings: Setting[] = [
  { id: 1, key: 'site_title', value: 'HMPS TRPL Politeknik Negeri Medan' },
  { id: 2, key: 'contact_email', value: 'contact@hmpstrplpolmed.com' },
  { id: 3, key: 'maintenance_mode', value: 'false' },
  { id: 4, key: 'active_management_year', value: '2024-2025' }
];

export const mockAdminStats: AdminStats = {
  totalPosts: 3,
  totalMembers: 9,
  totalDivisions: 3,
  totalInbox: 2,
  activePeriod: '2024-2025'
};

export async function apiAdminMutate<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: any
): Promise<{ success: boolean; message: string; data?: T }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hmps_auth_token') : null;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-User-Author': 'Hylmi',
      'X-Kampus-User': 'Polmed',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let requestBody: any;
    if (body) {
      if (typeof window !== 'undefined' && body instanceof FormData) {
        requestBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: requestBody,
    });

    const json = await res.json();
    return {
      success: json.success ?? res.ok,
      message: json.message ?? (res.ok ? 'Operation successful.' : 'Operation failed.'),
      data: json.data,
    };
  } catch (error) {
    console.error(`Admin mutation failed for ${method} ${path}:`, error);
    return {
      success: false,
      message: 'Failed to connect to backend server.',
    };
  }
}

export async function loginAdmin(body: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; data?: { token: string; user: User } }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    return {
      success: json.success ?? res.ok,
      message: json.message ?? (res.ok ? 'Login successful.' : 'Login failed.'),
      data: json.data,
    };
  } catch (error) {
    console.error('Failed to login:', error);
    // Simulate successful login if offline and default credentials match
    if (body.email === 'admin@hmpstrpl.com' && body.password === 'admin') {
      return {
        success: true,
        message: '[Local Simulation] Login successful! (Laravel API is offline)',
        data: {
          token: 'simulated-jwt-token-xyz-12345',
          user: mockUser,
        },
      };
    }
    return {
      success: false,
      message: 'Failed to connect to local authentication server.',
    };
  }
}

export interface Media {
  id: number;
  filename: string;
  url: string;
  size: number;
  created_at: string;
}

export const mockMedia: Media[] = [
  {
    id: 1,
    filename: 'hero_banner_polmed.png',
    url: '/images/hero_banner_polmed.png',
    size: 245000,
    created_at: '2026-07-01T12:00:00Z'
  },
  {
    id: 2,
    filename: 'logo_hmps_2024.png',
    url: '/images/logo_hmps_2024.png',
    size: 98000,
    created_at: '2026-07-02T09:30:00Z'
  }
];



