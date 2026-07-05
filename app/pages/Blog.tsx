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
    ClickableCard,
    TextInput,
    Spinner
} from '@astryxdesign/core';
import { apiFetch, getPostThumbnail, mockPosts, mockCategories, type Post, type Category } from '../utils/api';

export default function BlogIndexPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtering States
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Load categories
            const categoriesData = await apiFetch<Category[]>('/categories', mockCategories);
            setCategories(categoriesData);

            // Load posts
            const postsData = await apiFetch<Post[]>('/posts', mockPosts);
            const postsArray = Array.isArray(postsData) ? postsData : ((postsData as any)?.data || []);
            setPosts(postsArray);

            setLoading(false);
        }
        loadData();
    }, []);

    // Filter posts based on search query and selected category
    const filteredPosts = posts.filter(post => {
        const matchesSearch =
            post.title.toLowerCase().includes(search.toLowerCase()) ||
            (post.body && post.body.toLowerCase().includes(search.toLowerCase())) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory =
            selectedCategory === null ||
            post.category?.id === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
                <VStack gap={8} align="stretch">

                    {/* Header */}
                    <VStack gap={2} className="border-b border-border pb-8">
                        <Heading level={1} type="display-1" className="text-primary font-sans">
                            Artikel & Berita
                        </Heading>
                        <Text type="body" color="secondary" className="font-sans max-w-2xl">
                            Ikuti kabar teranyar seputar kegiatan himpunan, info resmi dari program studi TRPL, serta tutorial rekayasa perangkat lunak dari mahasiswa.
                        </Text>
                    </VStack>

                    {/* Filters Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {/* Search Input */}
                        <div className="md:col-span-1">
                            <TextInput
                                label="Cari Artikel"
                                isLabelHidden={true}
                                placeholder="Ketik kata kunci pencarian..."
                                value={search}
                                onChange={(val) => setSearch(val)}
                                hasClear={true}
                                width="100%"
                            />
                        </div>

                        {/* Categories filter list */}
                        <div className="md:col-span-2">
                            <VStack gap={2} align="start">
                                <Text type="supporting" color="secondary" weight="bold" className="text-xs uppercase tracking-wider font-sans">
                                    Kategori:
                                </Text>
                                <HStack gap={2} wrap="wrap">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors font-sans cursor-pointer ${selectedCategory === null
                                            ? 'bg-accent text-on-accent border-accent'
                                            : 'bg-surface border-border text-primary hover:bg-muted/30'
                                            }`}
                                    >
                                        Semua ({posts.length})
                                    </button>
                                    {categories.map((cat) => {
                                        const count = posts.filter(p => p.category?.id === cat.id).length;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors font-sans cursor-pointer ${selectedCategory === cat.id
                                                    ? 'bg-accent text-on-accent border-accent'
                                                    : 'bg-surface border-border text-primary hover:bg-muted/30'
                                                    }`}
                                            >
                                                {cat.name} ({count})
                                            </button>
                                        );
                                    })}
                                </HStack>
                            </VStack>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {filteredPosts.map((post) => {
                                const thumbnail = getPostThumbnail(post);
                                return (
                                <ClickableCard
                                    key={post.id}
                                    label={`Baca artikel: ${post.title}`}
                                    href={`/blog/${post.slug}`}
                                    variant="default"
                                    padding={5}
                                    className="flex flex-col gap-3 h-full"
                                >
                                    {thumbnail && (
                                        <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-border bg-muted/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    )}
                                    <HStack justify="between" align="center">
                                        <Badge variant="blue" label={post.category?.name || 'Berita'} />
                                        <Text type="supporting" color="secondary" className="text-xs">
                                            {new Date(post.published_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </HStack>
                                    <Heading level={3} className="text-primary font-sans mt-2 group-hover:text-accent transition-colors">
                                        {post.title}
                                    </Heading>
                                    <Text type="body" color="secondary" className="font-sans leading-relaxed">
                                        {post.excerpt}
                                    </Text>
                                    <div className="mt-auto pt-4 border-t border-border text-xs text-secondary flex justify-between items-center font-sans">
                                        <span>Oleh: {post.user?.name || 'Admin'}</span>
                                        <span className="font-medium text-accent">Baca Selengkapnya &rarr;</span>
                                    </div>
                                </ClickableCard>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-2xl">
                            <Text type="body" color="secondary" className="font-sans">
                                Tidak ada artikel yang cocok dengan pencarian Anda.
                            </Text>
                        </div>
                    )}

                </VStack>
            </main>

            <Footer />
        </div>
    );
}
