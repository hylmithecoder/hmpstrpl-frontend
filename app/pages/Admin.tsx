'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    HStack,
    VStack,
    Heading,
    Text,
    Badge,
    Card,
    Button,
    Spinner,
    TextInput,
    Banner,
    Divider,
    Avatar
} from '@astryxdesign/core';
import {
    apiAdminFetch,
    apiAdminMutate,
    apiFetch,
    mockAdminStats,
    mockPosts,
    mockStrukturOrganisasi,
    mockInbox,
    mockSettings,
    mockCategories,
    mockTags,
    mockManagementYears,
    mockMedia,
    type Post,
    type Member,
    type ContactMessage,
    type Setting,
    type AdminStats,
    type Category,
    type Tag,
    type Division,
    type ManagementYear,
    type Media,
    type Position,
    type PostSection,
    sanitizeHtml,
    containsForbiddenScript,
    postBodyToSections,
    API_ORIGIN
} from '../utils/api';
import { useRouter } from 'next/navigation';
import { FiTrash, FiEdit } from 'react-icons/fi';
import PostSectionEditor from '../components/PostSectionEditor';

type TabType = 'overview' | 'posts' | 'categories' | 'members' | 'divisions' | 'years' | 'media' | 'inbox' | 'settings';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);

    // Auth Guard Checking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('hmps_auth_token');
            if (!token) {
                router.push('/login');
            } else {
                setIsAuthenticated(true);
            }
        }
    }, [router]);

    // Data States
    const [stats, setStats] = useState<AdminStats>(mockAdminStats);
    const [posts, setPosts] = useState<Post[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [inbox, setInbox] = useState<ContactMessage[]>([]);
    const [settings, setSettings] = useState<Setting[]>(mockSettings);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [years, setYears] = useState<ManagementYear[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [media, setMedia] = useState<Media[]>([]);

    // Form States (Create Post)
    const [postTitle, setPostTitle] = useState('');
    const [postSlug, setPostSlug] = useState('');
    const [postExcerpt, setPostExcerpt] = useState('');
    // Post body as JSON sections: [{ content: "<p>…</p>", file: ["url", …] }]
    const [postSections, setPostSections] = useState<PostSection[]>([]);
    // Bumped after submit to remount (reset) the section editor
    const [postEditorKey, setPostEditorKey] = useState(0);
    const [showPostForm, setShowPostForm] = useState(false);
    const [editPostUuid, setEditPostUuid] = useState<string | null>(null);

    // Form States (Create Member)
    const [memberName, setMemberName] = useState('');
    const [memberNim, setMemberNim] = useState('');
    const [memberPosition, setMemberPosition] = useState('');
    // Sentinel select value for creating a brand-new position inline
    const NEW_POSITION_VALUE = '__new_position__';
    const [newPositionName, setNewPositionName] = useState('');
    const [memberDivision, setMemberDivision] = useState('Pengurus Harian (PH)');
    // Sentinel select value for creating a brand-new division inline
    const NEW_DIVISION_VALUE = '__new_division__';
    const [newDivisionName, setNewDivisionName] = useState('');
    const [memberYear, setMemberYear] = useState('2024-2025');
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);
    const [editMemberUuid, setEditMemberUuid] = useState<string | null>(null);

    // Form States (Create Category)
    const [catName, setCatName] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [showCatForm, setShowCatForm] = useState(false);

    // Form States (Create Tag)
    const [tagName, setTagName] = useState('');
    const [showTagForm, setShowTagForm] = useState(false);

    // Form States (Create Division)
    const [divName, setDivName] = useState('');
    const [divAlias, setDivAlias] = useState('');
    const [showDivForm, setShowDivForm] = useState(false);

    // Form States (Create Management Year Period)
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [showYearForm, setShowYearForm] = useState(false);

    // Form States (Upload Media File)
    const [mediaName, setMediaName] = useState('');
    const [showMediaForm, setShowMediaForm] = useState(false);

    // Banner State
    const [bannerStatus, setBannerStatus] = useState<'success' | 'error' | null>(null);
    const [bannerMsg, setBannerMsg] = useState('');

    useEffect(() => {
        if (!isAuthenticated) return;
        async function loadAdminData() {
            setLoading(true);
            try {
                // Fetch stats
                const statsData = await apiAdminFetch<AdminStats>('/admin/stats', mockAdminStats);
                setStats(statsData);

                // Fetch posts
                const postsData = await apiFetch<Post[]>('/posts', mockPosts);
                const postsArray = Array.isArray(postsData) ? postsData : ((postsData as any)?.data || []);
                setPosts(postsArray);

                // Fetch members (from all mock structured periods)
                const allMembers: Member[] = [];
                Object.keys(mockStrukturOrganisasi).forEach(yearSlug => {
                    const struct = mockStrukturOrganisasi[yearSlug];
                    struct.divisions?.forEach(div => {
                        div.members?.forEach(m => {
                            allMembers.push({
                                ...m,
                                division: { id: div.id, name: div.name, alias: div.alias },
                                managementyear: { id: struct.id, start_year: struct.start_year, end_year: struct.end_year, slug: struct.slug }
                            });
                        });
                    });
                });

                const membersData = await apiFetch<Member[]>('/members', allMembers);
                const membersArray = Array.isArray(membersData) ? membersData : ((membersData as any)?.data || allMembers);
                setMembers(membersArray);

                // Fetch inbox messages
                const inboxData = await apiAdminFetch<ContactMessage[]>('/admin/contacts', mockInbox);
                setInbox(inboxData);

                // Fetch settings
                const settingsData = await apiAdminFetch<Setting[]>('/admin/settings', mockSettings);
                setSettings(settingsData);

                // Fetch categories & tags
                const catsData = await apiFetch<Category[]>('/categories', mockCategories);
                setCategories(catsData);
                const tagsData = await apiFetch<Tag[]>('/tags', mockTags);
                setTags(tagsData);

                // Fetch divisions & years
                const divsData = await apiFetch<Division[]>('/divisions', [
                    { id: 1, name: 'Pengurus Harian (PH)', alias: 'ph' },
                    { id: 2, name: 'Divisi IPTEK & Kurikulum', alias: 'iptek' },
                    { id: 3, name: 'Divisi Humas & Pengabdian', alias: 'humas' }
                ]);
                setDivisions(divsData);
                const yearsData = await apiFetch<ManagementYear[]>('/management-years', mockManagementYears);
                setYears(yearsData);

                const positionsData = await apiFetch<Position[]>('/positions', [
                    { id: 1, name: 'Ketua Umum' },
                    { id: 2, name: 'Wakil Ketua Umum' },
                    { id: 3, name: 'Sekretaris' },
                    { id: 4, name: 'Bendahara' },
                    { id: 5, name: 'Kepala Divisi' },
                    { id: 6, name: 'Anggota' }
                ]);
                setPositions(positionsData);
                if (yearsData.length > 0) {
                    console.log(yearsData)
                    setMemberYear(yearsData[0].slug);
                }
                if (divsData.length > 0) {
                    setMemberDivision(divsData[0].name);
                }
                if (positionsData.length > 0) {
                    setMemberPosition(positionsData[0].name);
                }

                // Fetch media
                const mediaData = await apiAdminFetch<Media[]>('/admin/media', mockMedia);
                setMedia(mediaData);
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadAdminData();
    }, [isAuthenticated]);

    const handleLogout = () => {
        localStorage.removeItem('hmps_auth_token');
        localStorage.removeItem('hmps_auth_user');
        window.dispatchEvent(new Event('storage'));
        router.push('/login');
    };

    // Post Submission Handler
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        // <script>, inline event handlers, and javascript: URLs are forbidden in article content
        if (postSections.some(s => containsForbiddenScript(s.content))) {
            setBannerStatus('error');
            setBannerMsg('Konten artikel dilarang mengandung <script> atau kode JavaScript.');
            return;
        }

        // Sanitize each section and drop the empty ones ('<p></p>' is TipTap's empty state)
        const cleanSections = postSections
            .map(s => ({ content: sanitizeHtml(s.content).trim(), file: s.file }))
            .filter(s => (s.content && s.content !== '<p></p>') || s.file.length > 0);

        if (!postTitle || !postSlug || cleanSections.length === 0) {
            setBannerStatus('error');
            setBannerMsg('Judul, Slug, dan Konten Artikel wajib diisi.');
            return;
        }

        const postBody = JSON.stringify(cleanSections);
        const firstText = cleanSections[0].content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        const bodyData = {
            title: postTitle,
            slug: postSlug,
            excerpt: postExcerpt || firstText.slice(0, 100) + '...',
            body: postBody,
            category_id: 1,
            status: 'PUBLISHED'
        };

        const result = editPostUuid
            ? await apiAdminMutate<Post>(`/admin/posts/${editPostUuid}`, 'PUT', bodyData)
            : await apiAdminMutate<Post>('/admin/posts', 'POST', bodyData);
        if (result.success) {
            const savedPost = result.data || {
                id: posts.length + 1,
                uuid: editPostUuid || `post-${posts.length + 1}`,
                title: postTitle,
                slug: postSlug,
                excerpt: bodyData.excerpt,
                body: postBody,
                status: 'PUBLISHED' as const,
                published_at: new Date().toISOString(),
                views: 0,
                category: { id: 1, name: 'Berita & Pengumuman' },
                tags: [],
                user: { id: 1, name: 'Hylmi', email: 'hylmi@polmed.ac.id', username: 'hylmi' }
            };
            if (editPostUuid) {
                setPosts(posts.map(p => p.uuid === editPostUuid ? { ...p, ...savedPost } : p));
                setBannerMsg('Artikel berhasil diperbarui!');
            } else {
                setPosts([savedPost, ...posts]);
                setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
                setBannerMsg('Artikel baru berhasil dipublikasikan!');
            }
            setPostTitle('');
            setPostSlug('');
            setPostExcerpt('');
            setPostSections([]);
            setPostEditorKey(prev => prev + 1);
            setEditPostUuid(null);
            setShowPostForm(false);
            setBannerStatus('success');
        } else {
            setBannerStatus('error');
            setBannerMsg(result.message);
        }
    };

    // Member Submission Handler
    const handleCreateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberName || !memberPosition) {
            setBannerStatus('error');
            setBannerMsg('Nama dan Jabatan wajib diisi.');
            return;
        }

        const selectedYearObj = years.find(y => y.slug === memberYear) || years[0];
        console.log(selectedYearObj)
        // Resolve division: create it on the fly when "Buat Divisi Baru" is chosen
        let selectedDivObj = divisions.find(d => d.name === memberDivision) || divisions[0];
        if (memberDivision === NEW_DIVISION_VALUE) {
            const name = newDivisionName.trim();
            if (!name) {
                setBannerStatus('error');
                setBannerMsg('Nama divisi baru wajib diisi.');
                return;
            }
            const alias = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
            const existingDiv = divisions.find(d =>
                d.name.toLowerCase() === name.toLowerCase() || d.alias.toLowerCase() === alias
            );
            if (existingDiv) {
                selectedDivObj = existingDiv;
            } else {
                const divResult = await apiAdminMutate<Division>('/admin/divisions', 'POST', { name, alias });
                const createdDiv = divResult.data;
                if (!divResult.success || !createdDiv) {
                    setBannerStatus('error');
                    setBannerMsg(divResult.message || 'Gagal membuat divisi baru.');
                    return;
                }
                selectedDivObj = createdDiv;
                setDivisions(prev => [...prev, createdDiv]);
                setStats(prev => ({ ...prev, totalDivisions: prev.totalDivisions + 1 }));
            }
        }

        // Resolve position: create it on the fly when "Buat Jabatan Baru" is chosen
        let selectedPosObj = positions.find(p => p.name === memberPosition) || positions[0];
        if (memberPosition === NEW_POSITION_VALUE) {
            const name = newPositionName.trim();
            if (!name) {
                setBannerStatus('error');
                setBannerMsg('Nama jabatan baru wajib diisi.');
                return;
            }
            const existing = positions.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                selectedPosObj = existing;
            } else {
                const posResult = await apiAdminMutate<Position>('/admin/positions', 'POST', { name });
                const created = posResult.data;
                if (!posResult.success || !created) {
                    setBannerStatus('error');
                    setBannerMsg(posResult.message || 'Gagal membuat jabatan baru.');
                    return;
                }
                selectedPosObj = created;
                setPositions(prev => [...prev, created]);
            }
        }

        const formData = new FormData();
        formData.append('name', memberName);
        if (memberNim) formData.append('nim', memberNim);
        if (selectedDivObj) formData.append('division_id', selectedDivObj.id.toString());
        if (selectedPosObj) formData.append('position_id', selectedPosObj.id.toString());
        if (selectedYearObj) formData.append('managementyear_id', selectedYearObj.id.toString());
        if (memberPhotoFile) {
            formData.append('photo', memberPhotoFile);
        }
        formData.append('bio', 'Anggota staf pengurus baru HMPS TRPL.');

        let result;
        if (editMemberUuid) {
            result = await apiAdminMutate<Member>(`/admin/members/${editMemberUuid}`, 'PUT', formData);
        } else {
            result = await apiAdminMutate<Member>('/admin/members', 'POST', formData);
        }

        if (result.success) {
            const updatedMember = result.data || {
                uuid: editMemberUuid || `m-${members.length + 1}`,
                name: memberName,
                nim: memberNim,
                position: selectedPosObj || { id: 1, name: memberPosition },
                division: selectedDivObj || { id: 1, name: memberDivision, alias: memberDivision.toLowerCase() },
                managementyear: selectedYearObj ? {
                    id: selectedYearObj.id,
                    start_year: selectedYearObj.start_year,
                    end_year: selectedYearObj.end_year,
                    slug: selectedYearObj.slug
                } : undefined,
                bio: 'Anggota staf pengurus baru HMPS TRPL.',
                photo: memberPhotoFile ? URL.createObjectURL(memberPhotoFile) : ''
            };

            if (editMemberUuid) {
                setMembers(members.map(m => m.uuid === editMemberUuid ? updatedMember : m));
                setBannerMsg('Data anggota berhasil diperbarui!');
            } else {
                setMembers([updatedMember, ...members]);
                setStats(prev => ({ ...prev, totalMembers: prev.totalMembers + 1 }));
                setBannerMsg('Anggota pengurus baru berhasil ditambahkan!');
            }

            setMemberName('');
            setMemberNim('');
            setMemberPosition('');
            setNewPositionName('');
            setMemberDivision(divisions[0]?.name || '');
            setNewDivisionName('');
            setMemberPhotoFile(null);
            setEditMemberUuid(null);
            setShowMemberForm(false);
            setBannerStatus('success');
        } else {
            setBannerStatus('error');
            setBannerMsg(result.message);
        }
    };

    // Category Submission Handler
    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName) {
            setBannerStatus('error');
            setBannerMsg('Nama Kategori wajib diisi.');
            return;
        }
        const newCat: Category = {
            id: categories.length + 1,
            name: catName,
            description: catDesc
        };
        setCategories([...categories, newCat]);
        setCatName('');
        setCatDesc('');
        setShowCatForm(false);
        setBannerStatus('success');
        setBannerMsg('Kategori baru berhasil dibuat!');
    };

    // Tag Submission Handler
    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagName) {
            setBannerStatus('error');
            setBannerMsg('Nama Tag wajib diisi.');
            return;
        }
        const newTag: Tag = {
            id: tags.length + 1,
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            posts_count: 0
        };
        setTags([...tags, newTag]);
        setTagName('');
        setShowTagForm(false);
        setBannerStatus('success');
        setBannerMsg('Tag baru berhasil dibuat!');
    };

    const handleCreateDivision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!divName || !divAlias) {
            setBannerStatus('error');
            setBannerMsg('Nama dan Alias Divisi wajib diisi.');
            return;
        }

        const bodyData = {
            name: divName,
            alias: divAlias.toLowerCase()
        };

        const result = await apiAdminMutate<Division>('/admin/divisions', 'POST', bodyData);
        if (result.success) {
            const createdDiv = result.data || {
                id: divisions.length + 1,
                name: divName,
                alias: divAlias.toLowerCase()
            };
            setDivisions([...divisions, createdDiv]);
            setStats(prev => ({ ...prev, totalDivisions: prev.totalDivisions + 1 }));
            setDivName('');
            setDivAlias('');
            setShowDivForm(false);
            setBannerStatus('success');
            setBannerMsg('Divisi baru berhasil dibuat!');
        } else {
            setBannerStatus('error');
            setBannerMsg(result.message);
        }
    };

    // Management Year Period Submission Handler
    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        const start = parseInt(yearStart);
        const end = parseInt(yearEnd);
        if (isNaN(start) || isNaN(end) || end <= start) {
            setBannerStatus('error');
            setBannerMsg('Format tahun tidak valid atau tahun selesai harus lebih besar.');
            return;
        }
        const newYear: ManagementYear = {
            id: years.length + 1,
            start_year: start,
            end_year: end,
            slug: `${start}-${end}`
        };
        const response = await apiAdminMutate("/admin/management-years", "POST", newYear);
        if (!response.success) {
            setBannerStatus('error');
            setBannerMsg(response.message);
            return;
        }
        setYears([newYear, ...years]);
        setYearStart('');
        setYearEnd('');
        setShowYearForm(false);
        setBannerStatus('success');
        setBannerMsg('Periode kepengurusan baru berhasil ditambahkan!');
    };

    // Media Library Upload Submission Handler
    const handleUploadMedia = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaName) {
            setBannerStatus('error');
            setBannerMsg('Nama berkas media wajib diisi.');
            return;
        }
        const newFile: Media = {
            id: media.length + 1,
            filename: mediaName.includes('.') ? mediaName : `${mediaName}.png`,
            url: `/images/${mediaName}`,
            size: Math.floor(Math.random() * 300000) + 15000,
            created_at: new Date().toISOString()
        };
        setMedia([newFile, ...media]);
        setMediaName('');
        setShowMediaForm(false);
        setBannerStatus('success');
        setBannerMsg('Berkas media berhasil diunggah!');
    };

    // Settings Save Handler
    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setBannerStatus('success');
        setBannerMsg('Pengaturan situs berhasil diperbarui!');
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen bg-body text-primary items-center justify-center font-sans">
                <Spinner size="lg" />
                <Text type="supporting" color="secondary" className="mt-3 font-sans">Memuat verifikasi login...</Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250 font-sans">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
                <VStack gap={8} align="stretch">

                    {/* Header */}
                    <HStack justify="between" align="end" wrap="wrap" gap={4} className="border-b border-border pb-6">
                        <VStack gap={1}>
                            <Heading level={1} type="display-2" className="text-primary font-sans leading-tight">
                                Dashboard Admin
                            </Heading>
                            <Text type="body" color="secondary" className="font-sans">
                                Kelola konten, kepengurusan, dan pesan masuk HMPS TRPL Polmed.
                            </Text>
                        </VStack>
                        <div>
                            <Button
                                variant="destructive"
                                size="md"
                                label="Keluar / Logout"
                                onClick={handleLogout}
                            />
                        </div>
                    </HStack>

                    {/* Banner notification */}
                    {bannerStatus && (
                        <Banner
                            status={bannerStatus}
                            title={bannerStatus === 'success' ? 'Berhasil' : 'Terdapat Kesalahan'}
                            description={bannerMsg}
                            onDismiss={() => setBannerStatus(null)}
                        />
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                            {/* Tab Navigation Menu */}
                            <div className="lg:col-span-1">
                                <Card variant="muted" padding={4} className="h-fit">
                                    <VStack gap={1} align="stretch">
                                        {[
                                            { id: 'overview', label: 'Ringkasan' },
                                            { id: 'posts', label: `Artikel (${posts.length})` },
                                            { id: 'categories', label: `Kategori & Tag` },
                                            { id: 'members', label: `Anggota (${members.length})` },
                                            { id: 'divisions', label: `Divisi (${divisions.length})` },
                                            { id: 'years', label: `Periode (${years.length})` },
                                            { id: 'media', label: `Media Library (${media.length})` },
                                            { id: 'inbox', label: `Pesan Masuk (${inbox.length})` },
                                            { id: 'settings', label: 'Pengaturan' }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as TabType)}
                                                className={`text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === tab.id
                                                    ? 'bg-accent text-on-accent'
                                                    : 'text-secondary hover:bg-muted/30 hover:text-primary'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </VStack>
                                </Card>
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-3">

                                {/* 1. OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <VStack gap={6} align="stretch">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Card variant="default" padding={4} className="text-center">
                                                <VStack gap={1}>
                                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Artikel</Text>
                                                    <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalPosts}</Heading>
                                                </VStack>
                                            </Card>
                                            <Card variant="default" padding={4} className="text-center">
                                                <VStack gap={1}>
                                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Anggota</Text>
                                                    <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalMembers}</Heading>
                                                </VStack>
                                            </Card>
                                            <Card variant="default" padding={4} className="text-center">
                                                <VStack gap={1}>
                                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Divisi</Text>
                                                    <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalDivisions}</Heading>
                                                </VStack>
                                            </Card>
                                            <Card variant="default" padding={4} className="text-center">
                                                <VStack gap={1}>
                                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Pesan</Text>
                                                    <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalInbox}</Heading>
                                                </VStack>
                                            </Card>
                                        </div>

                                        {/* Quick Overview Lists */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card variant="default" padding={5}>
                                                <VStack gap={4} align="stretch">
                                                    <HStack justify="between" align="center">
                                                        <Heading level={3} className="text-primary font-sans">Artikel Terbaru</Heading>
                                                        <Button variant="ghost" size="sm" label="Semua" onClick={() => setActiveTab('posts')} />
                                                    </HStack>
                                                    <Divider />
                                                    <VStack gap={3} align="stretch">
                                                        {posts.slice(0, 3).map((p) => (
                                                            <HStack key={p.id} justify="between" align="center">
                                                                <Text type="body" weight="semibold" className="text-primary text-sm truncate max-w-[200px]">
                                                                    {p.title}
                                                                </Text>
                                                                <Badge variant="neutral" label={`${p.views} views`} />
                                                            </HStack>
                                                        ))}
                                                    </VStack>
                                                </VStack>
                                            </Card>

                                            <Card variant="default" padding={5}>
                                                <VStack gap={4} align="stretch">
                                                    <HStack justify="between" align="center">
                                                        <Heading level={3} className="text-primary font-sans">Pesan Terbaru</Heading>
                                                        <Button variant="ghost" size="sm" label="Semua" onClick={() => setActiveTab('inbox')} />
                                                    </HStack>
                                                    <Divider />
                                                    <VStack gap={3} align="stretch">
                                                        {inbox.slice(0, 3).map((msg) => (
                                                            <VStack key={msg.id} gap={1} align="start" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                                <Text type="supporting" weight="bold" className="text-primary text-xs leading-none">{msg.name}</Text>
                                                                <Text type="supporting" color="secondary" className="text-xs truncate max-w-[220px]">{msg.subject}</Text>
                                                            </VStack>
                                                        ))}
                                                    </VStack>
                                                </VStack>
                                            </Card>
                                        </div>
                                    </VStack>
                                )}

                                {/* 2. POSTS TAB */}
                                {activeTab === 'posts' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="center">
                                            <Heading level={2} className="text-primary font-sans text-xl">Daftar Artikel</Heading>
                                            <Button
                                                variant={showPostForm ? 'secondary' : 'primary'}
                                                size="md"
                                                label={showPostForm ? 'Batal' : 'Buat Artikel Baru'}
                                                onClick={() => {
                                                    if (showPostForm) {
                                                        setShowPostForm(false);
                                                    } else {
                                                        setEditPostUuid(null);
                                                        setPostTitle('');
                                                        setPostSlug('');
                                                        setPostExcerpt('');
                                                        setPostSections([]);
                                                        setPostEditorKey(prev => prev + 1);
                                                        setShowPostForm(true);
                                                    }
                                                }}
                                            />
                                        </HStack>

                                        {showPostForm && (
                                            <Card variant="muted" padding={5}>
                                                <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                                                    <Heading level={3} className="text-primary font-sans">{editPostUuid ? 'Edit Artikel' : 'Tulis Artikel Baru'}</Heading>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <TextInput
                                                            label="Judul Artikel"
                                                            value={postTitle}
                                                            onChange={(val) => {
                                                                setPostTitle(val);
                                                                setPostSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                                                            }}
                                                            isRequired={true}
                                                            placeholder="Masukkan judul..."
                                                        />
                                                        <TextInput
                                                            label="Slug URL"
                                                            value={postSlug}
                                                            onChange={(val) => setPostSlug(val)}
                                                            isRequired={true}
                                                            placeholder="judul-artikel-anda"
                                                        />
                                                    </div>
                                                    <TextInput
                                                        label="Ringkasan Pendek (Excerpt)"
                                                        value={postExcerpt}
                                                        onChange={(val) => setPostExcerpt(val)}
                                                        placeholder="Ringkasan artikel..."
                                                    />
                                                    <VStack gap={2} align="stretch">
                                                        <Text type="label" className="text-primary text-sm font-semibold">Konten Artikel (per Section)</Text>
                                                        <Text type="supporting" color="secondary" className="text-xs font-sans">
                                                            Setiap section punya teks dan galeri gambarnya sendiri. Gambar pertama pada section pertama otomatis menjadi thumbnail artikel. Kode JavaScript / &lt;script&gt; tidak diizinkan.
                                                        </Text>
                                                        <PostSectionEditor key={postEditorKey} initialSections={postSections} onChange={setPostSections} />
                                                    </VStack>
                                                    <div className="pt-2 flex gap-2">
                                                        <Button type="submit" variant="primary" size="md" label={editPostUuid ? 'Update Artikel' : 'Publish Artikel'} />
                                                    </div>
                                                </form>
                                            </Card>
                                        )}

                                        <div className="border border-border rounded-xl overflow-hidden bg-surface">
                                            <VStack gap={0} align="stretch">
                                                {posts.map((p) => (
                                                    <div key={p.id} className="p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                                        <HStack justify="between" align="center" wrap="wrap" gap={3}>
                                                            <VStack gap={1} className="max-w-[70%]">
                                                                <Text type="body" weight="bold" className="text-primary leading-tight">{p.title}</Text>
                                                                <HStack gap={2} align="center">
                                                                    <Badge variant="blue" label={p.category?.name || 'Kabar'} />
                                                                    <Text type="supporting" color="secondary" className="text-xs">Views: {p.views}</Text>
                                                                </HStack>
                                                            </VStack>
                                                            <HStack gap={2}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    label=''
                                                                    onClick={() => {
                                                                        setEditPostUuid(p.uuid);
                                                                        setPostTitle(p.title);
                                                                        setPostSlug(p.slug);
                                                                        setPostExcerpt(p.excerpt || '');
                                                                        setPostSections(postBodyToSections(p.body));
                                                                        setPostEditorKey(prev => prev + 1);
                                                                        setShowPostForm(true);
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                >
                                                                    <FiEdit size={16} color="blue" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    label=''
                                                                    onClick={async () => {
                                                                        const res = await apiAdminMutate(`/admin/posts/${p.uuid}`, 'DELETE');
                                                                        if (res.success) {
                                                                            setPosts(posts.filter(item => item.id !== p.id));
                                                                            setStats(prev => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
                                                                            setBannerStatus('success');
                                                                            setBannerMsg('Artikel berhasil dihapus.');
                                                                        } else {
                                                                            setBannerStatus('error');
                                                                            setBannerMsg(res.message);
                                                                        }
                                                                    }}
                                                                >
                                                                    <FiTrash size={16} color="red" />
                                                                </Button>
                                                            </HStack>
                                                        </HStack>
                                                    </div>
                                                ))}
                                            </VStack>
                                        </div>
                                    </VStack>
                                )}

                                {/* 3. CATEGORIES & TAGS TAB */}
                                {activeTab === 'categories' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Categories Column */}
                                        <VStack gap={4} align="stretch">
                                            <HStack justify="between" align="center">
                                                <Heading level={2} className="text-primary font-sans text-lg">Kategori</Heading>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    label={showCatForm ? 'Batal' : 'Tambah'}
                                                    onClick={() => setShowCatForm(!showCatForm)}
                                                />
                                            </HStack>

                                            {showCatForm && (
                                                <Card variant="muted" padding={4}>
                                                    <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                                                        <TextInput
                                                            label="Nama Kategori"
                                                            value={catName}
                                                            onChange={setCatName}
                                                            isRequired={true}
                                                        />
                                                        <TextInput
                                                            label="Deskripsi (Opsional)"
                                                            value={catDesc}
                                                            onChange={setCatDesc}
                                                        />
                                                        <Button type="submit" variant="primary" size="sm" label="Simpan Kategori" />
                                                    </form>
                                                </Card>
                                            )}

                                            <div className="border border-border rounded-xl bg-surface p-4">
                                                <VStack gap={3} align="stretch">
                                                    {categories.map(c => (
                                                        <HStack key={c.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                            <VStack gap={0.5}>
                                                                <Text type="body" weight="bold" className="text-primary text-sm">{c.name}</Text>
                                                                {c.description && <Text type="supporting" color="secondary" className="text-xs">{c.description}</Text>}
                                                            </VStack>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                label="Hapus"
                                                                onClick={() => setCategories(categories.filter(item => item.id !== c.id))}
                                                            />
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </div>
                                        </VStack>

                                        {/* Tags Column */}
                                        <VStack gap={4} align="stretch">
                                            <HStack justify="between" align="center">
                                                <Heading level={2} className="text-primary font-sans text-lg">Tags</Heading>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    label={showTagForm ? 'Batal' : 'Tambah'}
                                                    onClick={() => setShowTagForm(!showTagForm)}
                                                />
                                            </HStack>

                                            {showTagForm && (
                                                <Card variant="muted" padding={4}>
                                                    <form onSubmit={handleCreateTag} className="flex flex-col gap-4">
                                                        <TextInput
                                                            label="Nama Tag"
                                                            value={tagName}
                                                            onChange={setTagName}
                                                            isRequired={true}
                                                        />
                                                        <Button type="submit" variant="primary" size="sm" label="Simpan Tag" />
                                                    </form>
                                                </Card>
                                            )}

                                            <div className="border border-border rounded-xl bg-surface p-4">
                                                <VStack gap={3} align="stretch">
                                                    {tags.map(t => (
                                                        <HStack key={t.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                            <Badge variant="neutral" label={`#${t.name}`} />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                label="Hapus"
                                                                onClick={() => setTags(tags.filter(item => item.id !== t.id))}
                                                            />
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </div>
                                        </VStack>
                                    </div>
                                )}

                                {/* 4. MEMBERS TAB */}
                                {activeTab === 'members' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="center">
                                            <Heading level={2} className="text-primary font-sans text-xl">Daftar Anggota</Heading>
                                            <Button
                                                variant={showMemberForm ? 'secondary' : 'primary'}
                                                size="md"
                                                label={showMemberForm ? 'Batal' : 'Tambah Anggota'}
                                                onClick={() => setShowMemberForm(!showMemberForm)}
                                            />
                                        </HStack>

                                        {showMemberForm && (
                                            <Card variant="muted" padding={5}>
                                                <form onSubmit={handleCreateMember} className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <TextInput
                                                            label="Nama Lengkap"
                                                            value={memberName}
                                                            onChange={setMemberName}
                                                            isRequired={true}
                                                        />
                                                        <VStack gap={2} align="stretch">
                                                            <Text type="label" className="text-primary text-sm font-semibold">Jabatan</Text>
                                                            <select
                                                                value={memberPosition}
                                                                onChange={(e) => setMemberPosition(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                                            >
                                                                {positions.map(p => (
                                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                                ))}
                                                                <option value={NEW_POSITION_VALUE}>+ Buat Jabatan Baru…</option>
                                                            </select>
                                                            {memberPosition === NEW_POSITION_VALUE && (
                                                                <TextInput
                                                                    label="Nama Jabatan Baru"
                                                                    value={newPositionName}
                                                                    onChange={setNewPositionName}
                                                                    isRequired={true}
                                                                />
                                                            )}
                                                        </VStack>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <VStack gap={2} align="stretch">
                                                            <Text type="label" className="text-primary text-sm font-semibold">Divisi</Text>
                                                            <select
                                                                value={memberDivision}
                                                                onChange={(e) => setMemberDivision(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                                            >
                                                                {divisions.map(d => (
                                                                    <option key={d.id} value={d.name}>{d.name}</option>
                                                                ))}
                                                                <option value={NEW_DIVISION_VALUE}>+ Buat Divisi Baru…</option>
                                                            </select>
                                                            {memberDivision === NEW_DIVISION_VALUE && (
                                                                <TextInput
                                                                    label="Nama Divisi Baru"
                                                                    value={newDivisionName}
                                                                    onChange={setNewDivisionName}
                                                                    isRequired={true}
                                                                />
                                                            )}
                                                        </VStack>
                                                        <VStack gap={2} align="stretch">
                                                            <Text type="label" className="text-primary text-sm font-semibold">Periode Kepengurusan</Text>
                                                            <select
                                                                value={memberYear}
                                                                onChange={(e) => setMemberYear(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-primary text-sm focus:outline-none"
                                                            >
                                                                {years.map(y => (
                                                                    <option key={y.id} value={y.slug}>{y.slug}</option>
                                                                ))}
                                                            </select>
                                                        </VStack>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Text type="label" className="text-primary text-sm font-semibold">Foto Anggota</Text>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setMemberPhotoFile(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:opacity-90 cursor-pointer"
                                                        />
                                                    </div>
                                                    <Button type="submit" variant="primary" size="md" label={editMemberUuid ? "Update Anggota" : "Simpan Anggota"} />
                                                </form>
                                            </Card>
                                        )}

                                        <div className="border border-border rounded-xl bg-surface">
                                            <VStack gap={0} align="stretch">
                                                {members.map(m => (
                                                    <div key={m.uuid} className="p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                                        <HStack justify="between" align="center" wrap="wrap" gap={3}>
                                                            <HStack gap={3} align="center">
                                                                <Avatar name={m.name} size="small" src={m.photo ? (m.photo.startsWith('http') || m.photo.startsWith('data:') || m.photo.startsWith('blob:') ? m.photo : `${API_ORIGIN}/storage/img/members/${m.photo}`) : undefined} />
                                                                <VStack gap={1}>
                                                                    <Text type="body" weight="bold" className="text-primary text-sm">{m.name}</Text>
                                                                    <HStack gap={2} align="center" wrap="wrap">
                                                                        <Badge variant="blue" label={m.position?.name || 'Staf'} />
                                                                        <Text type="supporting" color="secondary" className="text-xs">{m.division?.name}</Text>
                                                                        {m.managementyear?.slug && (
                                                                            <Badge variant="neutral" label={`Periode ${m.managementyear.slug}`} />
                                                                        )}
                                                                    </HStack>
                                                                </VStack>
                                                            </HStack>
                                                            <HStack gap={2}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    label=""
                                                                    onClick={() => {
                                                                        setEditMemberUuid(m.uuid);
                                                                        setMemberName(m.name);
                                                                        setMemberNim(m.nim || '');
                                                                        setMemberPosition(m.position?.name || '');
                                                                        setNewPositionName('');
                                                                        setMemberDivision(m.division?.name || divisions[0]?.name);
                                                                        setNewDivisionName('');
                                                                        setMemberYear(m.managementyear?.slug || years[0]?.slug);
                                                                        setMemberPhotoFile(null);
                                                                        setShowMemberForm(true);
                                                                    }}
                                                                >
                                                                    <FiEdit size={16} color="blue" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    label=""
                                                                    onClick={async () => {
                                                                        const res = await apiAdminMutate(`/admin/members/${m.uuid}`, 'DELETE');
                                                                        if (res.success) {
                                                                            setMembers(members.filter(item => item.uuid !== m.uuid));
                                                                            setStats(prev => ({ ...prev, totalMembers: Math.max(0, prev.totalMembers - 1) }));
                                                                            setBannerStatus('success');
                                                                            setBannerMsg('Anggota berhasil dihapus.');
                                                                        } else {
                                                                            setBannerStatus('error');
                                                                            setBannerMsg(res.message);
                                                                        }
                                                                    }}
                                                                >
                                                                    <FiTrash size={16} color="red" />
                                                                </Button>
                                                            </HStack>
                                                        </HStack>
                                                    </div>
                                                ))}
                                            </VStack>
                                        </div>
                                    </VStack>
                                )}

                                {/* 5. DIVISIONS TAB */}
                                {activeTab === 'divisions' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="center">
                                            <Heading level={2} className="text-primary font-sans text-xl">Daftar Divisi</Heading>
                                            <Button
                                                variant={showDivForm ? 'secondary' : 'primary'}
                                                size="md"
                                                label={showDivForm ? 'Batal' : 'Buat Divisi Baru'}
                                                onClick={() => setShowDivForm(!showDivForm)}
                                            />
                                        </HStack>

                                        {showDivForm && (
                                            <Card variant="muted" padding={5}>
                                                <form onSubmit={handleCreateDivision} className="flex flex-col gap-4">
                                                    <TextInput
                                                        label="Nama Divisi"
                                                        value={divName}
                                                        onChange={setDivName}
                                                        isRequired={true}
                                                        placeholder="Contoh: Divisi Kreatif & Multimedia"
                                                    />
                                                    <TextInput
                                                        label="Alias / Slug"
                                                        value={divAlias}
                                                        onChange={setDivAlias}
                                                        isRequired={true}
                                                        placeholder="Contoh: media"
                                                    />
                                                    <Button type="submit" variant="primary" size="md" label="Simpan Divisi" />
                                                </form>
                                            </Card>
                                        )}

                                        <div className="border border-border rounded-xl bg-surface p-4">
                                            <VStack gap={3} align="stretch">
                                                {divisions.map(d => (
                                                    <HStack key={d.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                        <VStack gap={0.5}>
                                                            <Text type="body" weight="bold" className="text-primary text-sm">{d.name}</Text>
                                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Alias: {d.alias}</Text>
                                                        </VStack>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            label=""
                                                            onClick={async () => {
                                                                const res = await apiAdminMutate(`/admin/divisions/${d.id}`, 'DELETE');
                                                                if (res.success) {
                                                                    setDivisions(divisions.filter(item => item.id !== d.id));
                                                                    setStats(prev => ({ ...prev, totalDivisions: Math.max(0, prev.totalDivisions - 1) }));
                                                                    setBannerStatus('success');
                                                                    setBannerMsg('Divisi berhasil dihapus.');
                                                                } else {
                                                                    setBannerStatus('error');
                                                                    setBannerMsg(res.message);
                                                                }
                                                            }}
                                                        >
                                                            <FiTrash size={16} color="red" />
                                                        </Button>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </div>
                                    </VStack>
                                )}

                                {/* 6. PERIODS TAB */}
                                {activeTab === 'years' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="center">
                                            <Heading level={2} className="text-primary font-sans text-xl">Periode Kepengurusan</Heading>
                                            <Button
                                                variant={showYearForm ? 'secondary' : 'primary'}
                                                size="md"
                                                label={showYearForm ? 'Batal' : 'Tambah Periode'}
                                                onClick={() => setShowYearForm(!showYearForm)}
                                            />
                                        </HStack>

                                        {showYearForm && (
                                            <Card variant="muted" padding={5}>
                                                <form onSubmit={handleCreateYear} className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <TextInput
                                                            label="Tahun Mulai"
                                                            value={yearStart}
                                                            onChange={setYearStart}
                                                            isRequired={true}
                                                            placeholder="2024"
                                                        />
                                                        <TextInput
                                                            label="Tahun Selesai"
                                                            value={yearEnd}
                                                            onChange={setYearEnd}
                                                            isRequired={true}
                                                            placeholder="2025"
                                                        />
                                                    </div>
                                                    <Button type="submit" variant="primary" size="md" label="Simpan Periode" />
                                                </form>
                                            </Card>
                                        )}

                                        <div className="border border-border rounded-xl bg-surface p-4">
                                            <VStack gap={3} align="stretch">
                                                {years.map(y => (
                                                    <HStack key={y.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                        <Text type="body" weight="semibold" className="text-primary text-sm">
                                                            Tahun Kepengurusan {y.start_year}/{y.end_year}
                                                        </Text>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            label="Hapus"
                                                            onClick={() => setYears(years.filter(item => item.id !== y.id))}
                                                        />
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </div>
                                    </VStack>
                                )}

                                {/* 7. MEDIA LIBRARY TAB */}
                                {activeTab === 'media' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="center">
                                            <Heading level={2} className="text-primary font-sans text-xl">Media Library</Heading>
                                            <Button
                                                variant={showMediaForm ? 'secondary' : 'primary'}
                                                size="md"
                                                label={showMediaForm ? 'Batal' : 'Upload Berkas'}
                                                onClick={() => setShowMediaForm(!showMediaForm)}
                                            />
                                        </HStack>

                                        {showMediaForm && (
                                            <Card variant="muted" padding={5}>
                                                <form onSubmit={handleUploadMedia} className="flex flex-col gap-4">
                                                    <TextInput
                                                        label="Nama Berkas"
                                                        value={mediaName}
                                                        onChange={setMediaName}
                                                        isRequired={true}
                                                        placeholder="nama_banner.png"
                                                    />
                                                    <Button type="submit" variant="primary" size="md" label="Simpan Berkas" />
                                                </form>
                                            </Card>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {media.map(file => (
                                                <Card key={file.id} variant="default" padding={4}>
                                                    <HStack justify="between" align="center">
                                                        <VStack gap={1} className="max-w-[70%]">
                                                            <Text type="body" weight="bold" className="text-primary text-sm truncate">{file.filename}</Text>
                                                            <Text type="supporting" color="disabled" className="text-xs">
                                                                Size: {Math.round(file.size / 1024)} KB &bull; {new Date(file.created_at).toLocaleDateString('id-ID')}
                                                            </Text>
                                                        </VStack>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            label="Hapus"
                                                            onClick={() => setMedia(media.filter(item => item.id !== file.id))}
                                                        />
                                                    </HStack>
                                                </Card>
                                            ))}
                                        </div>
                                    </VStack>
                                )}

                                {/* 8. INBOX TAB */}
                                {activeTab === 'inbox' && (
                                    <VStack gap={6} align="stretch">
                                        <Heading level={2} className="text-primary font-sans text-xl">Kotak Masuk Pesan</Heading>
                                        <VStack gap={4} align="stretch">
                                            {inbox.length > 0 ? (
                                                inbox.map((msg) => (
                                                    <Card key={msg.id} variant="default" padding={5}>
                                                        <VStack gap={3} align="stretch">
                                                            <HStack justify="between" align="center" wrap="wrap" gap={2} className="border-b border-border/50 pb-2">
                                                                <VStack gap={0.5}>
                                                                    <Text type="body" weight="bold" className="text-primary font-sans leading-none">{msg.name}</Text>
                                                                    <Text type="supporting" color="secondary" className="text-xs font-sans">{msg.email} &bull; {msg.phone || 'No phone'}</Text>
                                                                </VStack>
                                                                <Text type="supporting" color="disabled" className="text-xs">
                                                                    {new Date(msg.created_at).toLocaleDateString('id-ID')}
                                                                </Text>
                                                            </HStack>
                                                            <VStack gap={1}>
                                                                <Text type="body" weight="semibold" className="text-primary text-sm font-sans">{msg.subject}</Text>
                                                                <Text type="body" color="secondary" className="font-sans leading-relaxed text-sm text-justify">
                                                                    {msg.message}
                                                                </Text>
                                                            </VStack>
                                                            <div className="pt-2 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    label="Hapus"
                                                                    onClick={() => {
                                                                        setInbox(inbox.filter(item => item.id !== msg.id));
                                                                        setStats(prev => ({ ...prev, totalInbox: prev.totalInbox - 1 }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </VStack>
                                                    </Card>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 bg-surface border border-dashed border-border rounded-xl">
                                                    <Text type="body" color="secondary" className="font-sans">Tidak ada pesan masuk.</Text>
                                                </div>
                                            )}
                                        </VStack>
                                    </VStack>
                                )}

                                {/* 9. SETTINGS TAB */}
                                {activeTab === 'settings' && (
                                    <Card variant="default" padding={6}>
                                        <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                                            <Heading level={2} className="text-primary font-sans text-xl">Pengaturan Situs</Heading>
                                            <VStack gap={4} align="stretch">
                                                {settings.map((setting) => (
                                                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                                        <div className="md:col-span-1">
                                                            <Text type="body" weight="semibold" className="text-primary text-sm font-sans">
                                                                {setting.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            </Text>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <TextInput
                                                                label={setting.key}
                                                                isLabelHidden={true}
                                                                value={setting.value}
                                                                onChange={(val) => {
                                                                    setSettings(settings.map(s => s.id === setting.id ? { ...s, value: val } : s));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </VStack>
                                            <Divider />
                                            <div className="pt-2">
                                                <Button type="submit" variant="primary" size="md" label="Simpan Pengaturan" />
                                            </div>
                                        </form>
                                    </Card>
                                )}

                            </div>
                        </div>
                    )}

                </VStack>
            </main>

            <Footer />
        </div>
    );
}
