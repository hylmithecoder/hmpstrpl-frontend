import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HStack, VStack, Heading, Text, Badge, Card } from '@astryxdesign/core';
import {
    fetchInstagramMedia,
    fetchInstagramFeed,
    instagramCover,
    instagramTitle,
    instagramSlides,
    instagramHashtags,
    isInstagramReel,
    formatInstagramDate,
    INSTAGRAM_USERNAME,
    type InstagramMedia,
} from '../utils/api';

interface PageProps {
    params: Promise<{ id: string }>;
}

// Renders a caption the way Instagram does: line breaks preserved, hashtags
// and @mentions highlighted. Caption text is plain text, never HTML.
function Caption({ text }: { text: string }) {
    return (
        <div className="flex flex-col gap-3">
            {text.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;
                const parts = line.split(/(#[\p{L}\p{N}_]+|@[\w.]+)/gu);
                return (
                    <p key={i} className="text-primary font-sans leading-relaxed">
                        {parts.map((part, j) =>
                            part.startsWith('#') || part.startsWith('@') ? (
                                <span key={j} className="text-accent font-medium">{part}</span>
                            ) : (
                                <React.Fragment key={j}>{part}</React.Fragment>
                            )
                        )}
                    </p>
                );
            })}
        </div>
    );
}

export default async function BeritaDetailPage({ params }: PageProps) {
    const { id } = await params;

    const { media, error } = await fetchInstagramMedia(id);
    const { feed } = await fetchInstagramFeed(7, 'all');
    const otherItems = feed.items.filter(item => item.id !== id).slice(0, 3);

    if (!media) {
        return (
            <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
                <Navbar />
                <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-24">
                    <Card variant="muted" padding={8}>
                        <VStack gap={3} align="center" className="text-center">
                            <Heading level={1} className="text-primary font-sans text-xl">Berita tidak ditemukan</Heading>
                            <Text type="body" color="secondary" className="font-sans">
                                {error || 'Konten Instagram ini sudah tidak tersedia.'}
                            </Text>
                            <Link href="/berita" className="text-sm font-semibold text-accent font-sans decoration-none pt-2">
                                &larr; Kembali ke daftar berita
                            </Link>
                        </VStack>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    const slides = instagramSlides(media);
    const tags = instagramHashtags(media.caption, 12);
    const title = instagramTitle(media.caption, 120);

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-16">
                <VStack gap={8} align="stretch">

                    <VStack gap={4} align="stretch">
                        <Link href="/berita" className="text-sm font-medium text-secondary hover:text-primary font-sans decoration-none">
                            &larr; Semua Berita
                        </Link>

                        <HStack gap={3} align="center" wrap="wrap">
                            <Badge variant="blue" label={isInstagramReel(media) ? 'Reels' : 'Postingan'} />
                            <Text type="supporting" color="secondary" className="text-xs font-sans">
                                {formatInstagramDate(media.timestamp)}
                            </Text>
                            {INSTAGRAM_USERNAME && (
                                <Text type="supporting" color="secondary" className="text-xs font-sans">
                                    &middot; @{INSTAGRAM_USERNAME}
                                </Text>
                            )}
                        </HStack>

                        <Heading level={1} type="display-2" className="text-primary font-sans leading-tight">
                            {title}
                        </Heading>
                    </VStack>

                    {/* Media: carousel children scroll horizontally, single media fills the frame */}
                    {slides.length > 1 ? (
                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                            {slides.map((slide, i) => (
                                <div
                                    key={slide.id}
                                    className="relative snap-center shrink-0 w-[85%] md:w-[70%] aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-muted/20"
                                >
                                    {slide.media_type === 'VIDEO' && slide.media_url ? (
                                        <video
                                            src={slide.media_url}
                                            poster={slide.thumbnail_url}
                                            controls
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={slide.media_url || slide.thumbnail_url || ''}
                                            alt={`${title} — slide ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white">
                                        {i + 1}/{slides.length}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden border border-border bg-muted/20 flex justify-center">
                            {media.media_type === 'VIDEO' && media.media_url ? (
                                <video
                                    src={media.media_url}
                                    poster={media.thumbnail_url}
                                    controls
                                    playsInline
                                    className="max-h-[70vh] w-auto"
                                />
                            ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={instagramCover(media) || ''}
                                    alt={title}
                                    className="max-h-[70vh] w-auto object-contain"
                                />
                            )}
                        </div>
                    )}

                    {/* Caption */}
                    {media.caption && (
                        <Card variant="default" padding={6}>
                            <Caption text={media.caption} />
                        </Card>
                    )}

                    {tags.length > 0 && (
                        <HStack gap={2} wrap="wrap">
                            {tags.map(tag => (
                                <span key={tag} className="text-xs text-secondary bg-muted/40 px-2.5 py-1 rounded-full font-sans">
                                    #{tag}
                                </span>
                            ))}
                        </HStack>
                    )}

                    <div>
                        <a
                            href={media.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-on-accent font-sans decoration-none"
                        >
                            Lihat & beri komentar di Instagram &rarr;
                        </a>
                    </div>

                    {/* Other posts */}
                    {otherItems.length > 0 && (
                        <VStack gap={4} align="stretch" className="border-t border-border pt-8">
                            <Heading level={2} className="text-primary font-sans text-lg">Berita Lainnya</Heading>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {otherItems.map((item: InstagramMedia) => {
                                    const cover = instagramCover(item);
                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/berita/${item.id}`}
                                            className="group flex flex-col gap-2 decoration-none"
                                        >
                                            <div className="w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted/20">
                                                {cover && (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={cover} alt={instagramTitle(item.caption)} className="w-full h-full object-cover" loading="lazy" />
                                                )}
                                            </div>
                                            <Text type="supporting" color="secondary" className="font-sans text-xs">
                                                {formatInstagramDate(item.timestamp)}
                                            </Text>
                                            <Text type="body" className="text-primary font-sans text-sm leading-snug group-hover:text-accent transition-colors">
                                                {instagramTitle(item.caption, 70)}
                                            </Text>
                                        </Link>
                                    );
                                })}
                            </div>
                        </VStack>
                    )}

                </VStack>
            </main>

            <Footer />
        </div>
    );
}
