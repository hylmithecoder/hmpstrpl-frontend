'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    HStack,
    VStack,
    Heading,
    Text,
    Card,
    Button,
    Spinner,
    Banner
} from '@astryxdesign/core';
import {
    apiAdminFetch,
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
    mockUsers,
    type Post,
    type Member,
    type User,
    type ContactMessage,
    type Setting,
    type AdminStats,
    type Category,
    type Tag,
    type Division,
    type ManagementYear,
    type Media,
    type Position,
    API_ORIGIN
} from '../utils/api';
import { useRouter } from 'next/navigation';
import OverviewTab from '../components/admin/OverviewTab';
import PostsTab from '../components/admin/PostsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import MembersTab from '../components/admin/MembersTab';
import DivisionsTab from '../components/admin/DivisionsTab';
import PeriodsTab from '../components/admin/PeriodsTab';
import MediaTab from '../components/admin/MediaTab';
import InboxTab from '../components/admin/InboxTab';
import UsersTab from '../components/admin/UsersTab';
import SettingsTab from '../components/admin/SettingsTab';

type TabType = 'overview' | 'posts' | 'categories' | 'members' | 'divisions' | 'years' | 'media' | 'inbox' | 'users' | 'settings';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);

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
    const [users, setUsers] = useState<User[]>([]);

    const [bannerStatus, setBannerStatus] = useState<'success' | 'error' | null>(null);
    const [bannerMsg, setBannerMsg] = useState('');

    const showBanner = (status: 'success' | 'error', msg: string) => {
        setBannerStatus(status);
        setBannerMsg(msg);
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        async function loadAdminData() {
            setLoading(true);
            try {
                const statsData = await apiAdminFetch<AdminStats>('/admin/stats', mockAdminStats);
                setStats(statsData);

                const postsData = await apiFetch<Post[] | { data: Post[] }>('/posts', mockPosts);
                setPosts(
                    Array.isArray(postsData)
                        ? postsData
                        : Array.isArray((postsData as { data: Post[] }).data)
                            ? (postsData as { data: Post[] }).data
                            : []
                );

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
                setMembers(Array.isArray(membersData) ? membersData : allMembers);

                const inboxData = await apiAdminFetch<ContactMessage[]>('/admin/contacts', mockInbox);
                setInbox(inboxData);

                const settingsData = await apiAdminFetch<Setting[]>('/admin/settings', mockSettings);
                setSettings(settingsData);

                const catsData = await apiFetch<Category[]>('/categories', mockCategories);
                setCategories(catsData);
                const tagsData = await apiFetch<Tag[]>('/tags', mockTags);
                setTags(tagsData);

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
                if (yearsData.length > 0) setMemberYearDefault(yearsData[0].slug);
                if (divsData.length > 0) setMemberDivisionDefault(divsData[0].name);
                if (positionsData.length > 0) setMemberPositionDefault(positionsData[0].name);

                const mediaData = await apiAdminFetch<Media[]>('/admin/media', mockMedia);
                setMedia(mediaData);

                const usersData = await apiAdminFetch<User[]>('/admin/users', mockUsers);
                setUsers(Array.isArray(usersData) ? usersData : mockUsers);
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadAdminData();
    }, [isAuthenticated]);

    const [memberYearDefault, setMemberYearDefault] = useState('2024-2025');
    const [memberDivisionDefault, setMemberDivisionDefault] = useState('');
    const [memberPositionDefault, setMemberPositionDefault] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('hmps_auth_token');
        localStorage.removeItem('hmps_auth_user');
        window.dispatchEvent(new Event('storage'));
        router.push('/login');
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen bg-body text-primary items-center justify-center font-sans">
                <Spinner size="lg" />
                <Text type="supporting" color="secondary" className="mt-3 font-sans">Memuat verifikasi login...</Text>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Ringkasan' },
        { id: 'posts', label: `Artikel (${posts.length})` },
        { id: 'categories', label: 'Kategori & Tag' },
        { id: 'members', label: `Anggota (${members.length})` },
        { id: 'divisions', label: `Divisi (${divisions.length})` },
        { id: 'years', label: `Periode (${years.length})` },
        { id: 'media', label: `Media Library (${media.length})` },
        { id: 'inbox', label: `Pesan Masuk (${inbox.length})` },
        { id: 'users', label: `Manajemen User (${users.length})` },
        { id: 'settings', label: 'Pengaturan' }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250 font-sans">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
                <VStack gap={8} align="stretch">
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
                            <Button variant="destructive" size="md" label="Keluar / Logout" onClick={handleLogout} />
                        </div>
                    </HStack>

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
                            <div className="lg:col-span-1">
                                <Card variant="muted" padding={4} className="h-fit">
                                    <VStack gap={1} align="stretch">
                                        {tabs.map((tab) => (
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

                            <div className="lg:col-span-3">
                                {activeTab === 'overview' && (
                                    <OverviewTab stats={stats} posts={posts} inbox={inbox} setActiveTab={setActiveTab} />
                                )}
                                {activeTab === 'posts' && (
                                    <PostsTab posts={posts} setPosts={setPosts} setStats={setStats} setBanner={showBanner} />
                                )}
                                {activeTab === 'categories' && (
                                    <CategoriesTab categories={categories} setCategories={setCategories} tags={tags} setTags={setTags} setBanner={showBanner} />
                                )}
                                {activeTab === 'members' && (
                                    <MembersTab
                                        members={members}
                                        setMembers={setMembers}
                                        divisions={divisions}
                                        setDivisions={setDivisions}
                                        positions={positions}
                                        setPositions={setPositions}
                                        years={years}
                                        setStats={setStats}
                                        setBanner={showBanner}
                                    />
                                )}
                                {activeTab === 'divisions' && (
                                    <DivisionsTab divisions={divisions} setDivisions={setDivisions} setStats={setStats} setBanner={showBanner} />
                                )}
                                {activeTab === 'years' && (
                                    <PeriodsTab years={years} setYears={setYears} setBanner={showBanner} />
                                )}
                                {activeTab === 'media' && (
                                    <MediaTab media={media} setMedia={setMedia} setBanner={showBanner} />
                                )}
                                {activeTab === 'inbox' && (
                                    <InboxTab inbox={inbox} setInbox={setInbox} setStats={setStats} />
                                )}
                                {activeTab === 'users' && (
                                    <UsersTab users={users} setUsers={setUsers} setBanner={showBanner} />
                                )}
                                {activeTab === 'settings' && (
                                    <SettingsTab settings={settings} setSettings={setSettings} setBanner={showBanner} />
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
