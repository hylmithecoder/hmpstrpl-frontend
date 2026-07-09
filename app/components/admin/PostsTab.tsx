'use client';

import React, { useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, Badge, HStack } from '@astryxdesign/core';
import { FiTrash, FiEdit } from 'react-icons/fi';
import PostSectionEditor from '../PostSectionEditor';
import {
    apiAdminMutate,
    type Post,
    type PostSection,
    sanitizeHtml,
    containsForbiddenScript,
    postBodyToSections,
} from '../../utils/api';

interface PostsTabProps {
    posts: Post[];
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    setStats: React.Dispatch<React.SetStateAction<any>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function PostsTab({ posts, setPosts, setStats, setBanner }: PostsTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [editUuid, setEditUuid] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [sections, setSections] = useState<PostSection[]>([]);
    const [editorKey, setEditorKey] = useState(0);

    const resetForm = () => {
        setTitle('');
        setSlug('');
        setExcerpt('');
        setSections([]);
        setEditorKey(prev => prev + 1);
        setEditUuid(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (sections.some(s => containsForbiddenScript(s.content))) {
            setBanner('error', 'Konten artikel dilarang mengandung <script> atau kode JavaScript.');
            return;
        }

        const cleanSections = sections
            .map(s => ({ content: sanitizeHtml(s.content).trim(), file: s.file }))
            .filter(s => (s.content && s.content !== '<p></p>') || s.file.length > 0);

        if (!title || !slug || cleanSections.length === 0) {
            setBanner('error', 'Judul, Slug, dan Konten Artikel wajib diisi.');
            return;
        }

        const postBody = JSON.stringify(cleanSections);
        const firstText = cleanSections[0].content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        const bodyData = {
            title,
            slug,
            excerpt: excerpt || firstText.slice(0, 100) + '...',
            body: postBody,
            category_id: 1,
            status: 'PUBLISHED'
        };

        const result = editUuid
            ? await apiAdminMutate<Post>(`/admin/posts/${editUuid}`, 'PUT', bodyData)
            : await apiAdminMutate<Post>('/admin/posts', 'POST', bodyData);

        if (result.success) {
            const savedPost = result.data || {
                id: posts.length + 1,
                uuid: editUuid || `post-${posts.length + 1}`,
                title,
                slug,
                excerpt: bodyData.excerpt,
                body: postBody,
                status: 'PUBLISHED' as const,
                published_at: new Date().toISOString(),
                views: 0,
                category: { id: 1, name: 'Berita & Pengumuman' },
                tags: [],
                user: { id: 1, name: 'Hylmi', email: 'hylmi@polmed.ac.id', username: 'hylmi' }
            };

            if (editUuid) {
                setPosts(posts.map(p => p.uuid === editUuid ? { ...p, ...savedPost } : p));
                setBanner('success', 'Artikel berhasil diperbarui!');
            } else {
                setPosts([savedPost, ...posts]);
                setStats((prev: any) => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
                setBanner('success', 'Artikel baru berhasil dipublikasikan!');
            }
            resetForm();
        } else {
            setBanner('error', result.message);
        }
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Daftar Artikel</Heading>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    size="md"
                    label={showForm ? 'Batal' : 'Buat Artikel Baru'}
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setEditUuid(null);
                            setTitle('');
                            setSlug('');
                            setExcerpt('');
                            setSections([]);
                            setEditorKey(prev => prev + 1);
                            setShowForm(true);
                        }
                    }}
                />
            </HStack>

            {showForm && (
                <Card variant="muted" padding={5}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Heading level={3} className="text-primary font-sans">{editUuid ? 'Edit Artikel' : 'Tulis Artikel Baru'}</Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Judul Artikel"
                                value={title}
                                onChange={(val) => {
                                    setTitle(val);
                                    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                                }}
                                isRequired={true}
                                placeholder="Masukkan judul..."
                            />
                            <TextInput
                                label="Slug URL"
                                value={slug}
                                onChange={setSlug}
                                isRequired={true}
                                placeholder="judul-artikel-anda"
                            />
                        </div>
                        <TextInput
                            label="Ringkasan Pendek (Excerpt)"
                            value={excerpt}
                            onChange={setExcerpt}
                            placeholder="Ringkasan artikel..."
                        />
                        <VStack gap={2} align="stretch">
                            <Text type="label" className="text-primary text-sm font-semibold">Konten Artikel (per Section)</Text>
                            <Text type="supporting" color="secondary" className="text-xs font-sans">
                                Setiap section punya teks dan galeri gambarnya sendiri. Gambar pertama pada section pertama otomatis menjadi thumbnail artikel. Kode JavaScript / &lt;script&gt; tidak diizinkan.
                            </Text>
                            <PostSectionEditor key={editorKey} initialSections={sections} onChange={setSections} />
                        </VStack>
                        <div className="pt-2 flex gap-2">
                            <Button type="submit" variant="primary" size="md" label={editUuid ? 'Update Artikel' : 'Publish Artikel'} />
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
                                            setEditUuid(p.uuid);
                                            setTitle(p.title);
                                            setSlug(p.slug);
                                            setExcerpt(p.excerpt || '');
                                            setSections(postBodyToSections(p.body));
                                            setEditorKey(prev => prev + 1);
                                            setShowForm(true);
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
                                                setStats((prev: any) => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
                                                setBanner('success', 'Artikel berhasil dihapus.');
                                            } else {
                                                setBanner('error', res.message);
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
    );
}
