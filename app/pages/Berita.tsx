'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import InstagramCover from '../components/InstagramCover';
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
    Spinner,
} from '@astryxdesign/core';
import {
    fetchInstagramFeed,
    INSTAGRAM_USERNAME,
    instagramSlides,
    instagramEmbedUrl,
    instagramTitle,
    instagramExcerpt,
    instagramHashtags,
    isInstagramReel,
    formatInstagramDate,
    type InstagramMedia,
    type InstagramFeedFilter,
} from '../utils/api';

const FILTERS: { id: InstagramFeedFilter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'image', label: 'Postingan' },
    { id: 'reels', label: 'Reels' },
];

const PAGE_SIZE = 12;

interface BeritaPageProps {
    // Collab posts curated by the admin; rendered as Instagram embeds because
    // the Graph API cannot return media owned by the partner account.
    collabLinks?: string[];
}

export default function BeritaPage({ collabLinks = [] }: BeritaPageProps) {
    const [items, setItems] = useState<InstagramMedia[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<InstagramFeedFilter>('all');
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(PAGE_SIZE);

    // Refetch whenever the type filter or the requested page size changes; the
    // backend already caches the Graph API response for 15 minutes.
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const { feed, error } = await fetchInstagramFeed(limit, filter);
            if (cancelled) return;
            setItems(feed.items);
            setError(error);
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [filter, limit]);

    const visible = items.filter(item => {
        const haystack = (item.caption || '').toLowerCase();
        return haystack.includes(search.toLowerCase());
    });

    const canLoadMore = !loading && items.length >= limit;

    // Embeds carry no caption or timestamp we can read, so they only show on
    // the unfiltered view — there is nothing to match a search or type against.
    const collabEmbeds =
        filter === 'all' && !search.trim()
            ? collabLinks
                  .map(link => ({ link, embed: instagramEmbedUrl(link) }))
                  .filter((item): item is { link: string; embed: string } => !!item.embed)
            : [];

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
                <VStack gap={8} align="stretch">

                    {/* Header */}
                    <VStack gap={2} className="border-b border-border pb-8">
                        <HStack gap={3} align="center" wrap="wrap">
                            <Heading level={1} type="display-1" className="text-primary font-sans">
                                Berita
                            </Heading>
                            <Badge variant="purple" label="Instagram" />
                        </HStack>
                        <Text type="body" color="secondary" className="font-sans max-w-2xl">
                            Kabar, pengumuman, dan dokumentasi kegiatan HMPS TRPL langsung dari akun Instagram
                            resmi himpunan — diperbarui otomatis setiap ada unggahan baru.
                        </Text>
                        {INSTAGRAM_USERNAME && (
                            <a
                                href={`https://www.instagram.com/${INSTAGRAM_USERNAME}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-accent font-sans decoration-none"
                            >
                                {`@${INSTAGRAM_USERNAME} di Instagram \u2192`}
                            </a>
                        )}
                    </VStack>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="md:col-span-1">
                            <TextInput
                                label="Cari Berita"
                                isLabelHidden={true}
                                placeholder="Ketik kata kunci pencarian..."
                                value={search}
                                onChange={(val) => setSearch(val)}
                                hasClear={true}
                                width="100%"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <VStack gap={2} align="start">
                                <Text type="supporting" color="secondary" weight="bold" className="text-xs uppercase tracking-wider font-sans">
                                    Jenis Konten:
                                </Text>
                                <HStack gap={2} wrap="wrap">
                                    {FILTERS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setFilter(f.id); setLimit(PAGE_SIZE); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors font-sans cursor-pointer ${filter === f.id
                                                ? 'bg-accent text-on-accent border-accent'
                                                : 'bg-surface border-border text-primary hover:bg-muted/30'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </HStack>
                            </VStack>
                        </div>
                    </div>

                    {/* Content */}
                    {loading && items.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : error ? (
                        <Card variant="muted" padding={8}>
                            <VStack gap={2} align="center" className="text-center">
                                <Heading level={3} className="text-primary font-sans text-base">
                                    Feed Instagram belum tersedia
                                </Heading>
                                <Text type="body" color="secondary" className="font-sans max-w-lg">
                                    {error}
                                </Text>
                                <Link href="/blog?category=news" className="text-sm font-semibold text-accent font-sans decoration-none pt-2">
                                    Lihat artikel & berita dari situs &rarr;
                                </Link>
                            </VStack>
                        </Card>
                    ) : visible.length > 0 || collabEmbeds.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {collabEmbeds.map(({ link, embed }) => (
                                    <Card
                                        key={link}
                                        variant="default"
                                        padding={5}
                                        className="flex flex-col gap-3 h-full"
                                    >
                                        <div className="w-full h-[460px] rounded-xl overflow-hidden border border-border bg-white">
                                            <iframe
                                                src={embed}
                                                title="Postingan kolaborasi Instagram"
                                                loading="lazy"
                                                scrolling="no"
                                                allowFullScreen
                                                className="w-full h-full border-0"
                                            />
                                        </div>
                                        <HStack justify="between" align="center">
                                            <Badge variant="green" label="Kolaborasi" />
                                            <a
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-medium text-accent font-sans decoration-none"
                                            >
                                                Buka di Instagram &rarr;
                                            </a>
                                        </HStack>
                                    </Card>
                                ))}

                                {visible.map(item => {
                                    const tags = instagramHashtags(item.caption, 3);
                                    return (
                                        <ClickableCard
                                            key={item.id}
                                            label={`Baca berita: ${instagramTitle(item.caption)}`}
                                            href={`/berita/${item.id}`}
                                            variant="default"
                                            padding={5}
                                            className="flex flex-col gap-3 h-full"
                                        >
                                            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-border bg-muted/20">
                                                <InstagramCover slides={instagramSlides(item)} alt={instagramTitle(item.caption)} />
                                                {isInstagramReel(item) && (
                                                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                                                        REELS
                                                    </span>
                                                )}
                                            </div>

                                            <HStack justify="between" align="center">
                                                <Badge variant="blue" label={isInstagramReel(item) ? 'Reels' : 'Postingan'} />
                                                <Text type="supporting" color="secondary" className="text-xs">
                                                    {formatInstagramDate(item.timestamp)}
                                                </Text>
                                            </HStack>

                                            <Heading level={3} className="text-primary font-sans mt-1 text-base leading-snug">
                                                {instagramTitle(item.caption)}
                                            </Heading>
                                            <Text type="body" color="secondary" className="font-sans leading-relaxed text-sm">
                                                {instagramExcerpt(item.caption, 140)}
                                            </Text>

                                            <div className="mt-auto pt-4 border-t border-border flex flex-wrap gap-2 items-center justify-between font-sans">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {tags.map(tag => (
                                                        <span key={tag} className="text-[10px] text-secondary bg-muted/40 px-2 py-0.5 rounded-full">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-medium text-accent">Selengkapnya &rarr;</span>
                                            </div>
                                        </ClickableCard>
                                    );
                                })}
                            </div>

                            {canLoadMore && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={() => setLimit(l => Math.min(l + PAGE_SIZE, 50))}
                                        disabled={limit >= 50}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border bg-surface text-primary hover:bg-muted/30 transition-colors font-sans cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memuat…' : limit >= 50 ? 'Batas feed tercapai' : 'Muat Lebih Banyak'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-2xl">
                            <Text type="body" color="secondary" className="font-sans">
                                Tidak ada berita yang cocok dengan pencarian Anda.
                            </Text>
                        </div>
                    )}

                </VStack>
            </main>

            <Footer />
        </div>
    );
}
