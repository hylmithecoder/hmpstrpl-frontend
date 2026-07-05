'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
    HStack,
    VStack,
    Heading,
    Text,
    Button,
    Badge,
    Card,
    ClickableCard,
    Spinner,
    Divider,
    SegmentedControl,
    SegmentedControlItem
} from '@astryxdesign/core';
import { apiFetch, mockPosts, getPostThumbnail, type Post } from '../utils/api';
import type { SlideData } from '../utils/slides';
import Link from 'next/link';
import Image from 'next/image';
import { CiLocationOn } from 'react-icons/ci';
import { FaDiscord, FaGithub, FaInstagram, FaYoutube, FaFacebook, FaWhatsapp } from 'react-icons/fa6';

interface HomeProps {
    slides: SlideData[];
}

export const Home = ({ slides: slideFiles }: HomeProps) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Active slide index (linear progression)
    const [slideIndex, setSlideIndex] = useState(0);

    // Active meme index for the interactive meme slide
    const [memeIndex, setMemeIndex] = useState(0);
    const [visiMisiTab, setVisiMisiTab] = useState<'visi' | 'misi'>('visi');
    const [divisionTab, setDivisionTab] = useState<'ph' | 'iptek' | 'humas'>('ph');

    // Layout coordinate mapping:
    // Slide 0 (Hero): row 0, col 0
    // Slide 1 (About): row 1, col 0 (Slides DOWN from Hero)
    // Subsequent slides: row 1, col 1, col 2, etc. (Slides RIGHT from About)
    const slides = React.useMemo(() =>
        slideFiles.map((slide, index) => {
            let row = 1;
            let col = 0;
            if (index === 0) {
                row = 0;
                col = 0;
            } else if (index === 1) {
                row = 1;
                col = 0;
            } else if (index === 2) {
                row = 1;
                col = 1;
            } else if (index === 3) {
                row = 1;
                col = 2;
            } else if (index === 4) {
                row = 2;
                col = 2;
            } else {
                row = 2;
                col = index - 2; // Slide 5 (Artikel) -> row 2, col 3; and supports potential future slides
            }
            return {
                ...slide,
                row,
                col
            };
        }), [slideFiles]);

    const memes = React.useMemo(() =>
        slides.find(s => s.id === 'meme')?.images.filter(img => !img.overlay) ?? [], [slides]);
    const currentMeme = memes.length > 0 ? memes[memeIndex % memes.length] : null;

    // Derive active coordinates for 2D transform calculations
    const activeSlide = slides[slideIndex];
    const coords = activeSlide ? { row: activeSlide.row, col: activeSlide.col } : { row: 0, col: 0 };

    // Click-to-reveal overlay images (markdown `{overlay ...}` attribute):
    // each click reveals the next overlay before the slide advances.
    // Skipped entirely on mobile — the fixed positions don't fit small screens.
    const [revealCount, setRevealCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const activeOverlayCount = (!isMobile && activeSlide) ? activeSlide.images.filter(img => img.overlay).length : 0;

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mediaQuery.matches);
        update();
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        setRevealCount(0);
    }, [slideIndex]);

    // Fetch posts for the blog slide
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const data = await apiFetch<Post[]>('/posts', mockPosts);
            const postsArray = Array.isArray(data) ? data : ((data as any)?.data || []);
            setPosts(postsArray.slice(0, 3));
            setLoading(false);
        }
        loadData();
    }, []);

    // Navigation helpers (reveal pending overlays before moving between slides)
    const goToNextSlide = () => {
        if (revealCount < activeOverlayCount) {
            setRevealCount(prev => prev + 1);
            return;
        }
        setSlideIndex(prev => Math.min(prev + 1, slides.length - 1));
    };

    const goToPreviousSlide = () => {
        if (revealCount > 0) {
            setRevealCount(prev => prev - 1);
            return;
        }
        setSlideIndex(prev => Math.max(prev - 1, 0));
    };

    // Click handler split: left side goes back, right side goes next
    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Ignore click on links, buttons, iframes, inputs, or selections
        if (
            target.closest('a') ||
            target.closest('button') ||
            target.closest('iframe') ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('.clickable-element') ||
            window.getSelection()?.toString()
        ) {
            return;
        }

        const clickX = e.clientX;
        const screenWidth = window.innerWidth;

        if (clickX < screenWidth * 0.35) {
            // Left 35% click: Go Back (Reverse)
            goToPreviousSlide();
        } else {
            // Right 65% click: Go Next
            goToNextSlide();
        }
    };

    // Keyboard navigation listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                goToNextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace') {
                e.preventDefault();
                goToPreviousSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length, slideIndex, revealCount, activeOverlayCount]);

    return (
        <div
            className="w-screen h-screen overflow-hidden relative bg-body text-primary font-sans select-none cursor-pointer"
            onClick={handleContainerClick}
        >

            {/* Overlayed glassmorphic Navbar */}
            <div className="absolute top-0 left-0 w-full z-50 bg-surface/30 backdrop-blur-md border-b border-border/30">
                <Navbar />
            </div>

            {/* Slide Canvas viewport */}
            <div className="relative w-full h-full">
                {slides.map((s, index) => {
                    const dx = s.col - coords.col;
                    const dy = s.row - coords.row;
                    const isActive = dx === 0 && dy === 0;

                    return (
                        <div
                            key={index}
                            className="absolute inset-0 w-full h-full flex flex-col justify-center items-center px-3 md:px-12 py-16 pb-20 md:py-24 transition-all duration-700 ease-out"
                            style={{
                                transform: `translate(${dx * 100}%, ${dy * 100}%)`,
                                opacity: isActive ? 1 : 0,
                                pointerEvents: isActive ? 'auto' : 'none',
                                visibility: Math.abs(dx) <= 1 && Math.abs(dy) <= 1 ? 'visible' : 'hidden'
                            }}
                        >
                            {/* Click-to-reveal overlay images, positioned via markdown {overlay top=… left=…} */}
                            {s.images.filter(img => img.overlay).map((img, overlayIdx) => {
                                const revealed = isActive && overlayIdx < revealCount;
                                const { rotate, width, radius, ...placement } = img.position ?? {};
                                return (
                                    <div
                                        key={`overlay-${overlayIdx}`}
                                        className="hidden md:block absolute z-40 pointer-events-none transition-all duration-500 ease-out drop-shadow-2xl"
                                        style={{
                                            ...placement,
                                            width: width || '240px',
                                            opacity: revealed ? 1 : 0,
                                            transform: `rotate(${rotate || '0deg'}) scale(${revealed ? 1 : 0.5})`
                                        }}
                                    >
                                        <Image
                                            src={img.src}
                                            alt={img.alt}
                                            width={600}
                                            height={600}
                                            className="w-full h-auto rounded-xl border border-border"
                                            style={{ borderRadius: radius }}
                                        />
                                    </div>
                                );
                            })}

                            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">

                                {/* 1. HERO SLIDE (0, 0) */}
                                {s.id === 'hero' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                        <VStack gap={4} align="start" className="lg:col-span-7">
                                            <Badge variant="blue" label={s.badge} />
                                            <Heading level={1} type="display-1" className="text-primary font-sans leading-tight tracking-tight">
                                                {s.title}
                                            </Heading>
                                            <Text type="large" color="secondary" className="font-sans text-justify">
                                                {s.description}
                                            </Text>
                                            <HStack gap={3} className="mt-4">
                                                <button
                                                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer bg-accent text-on-accent hover:brightness-110 active:scale-95 border-0 font-sans"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        goToNextSlide();
                                                    }}
                                                >
                                                    Mulai Presentasi ↓
                                                </button>
                                                <Button
                                                    variant="secondary"
                                                    size="lg"
                                                    label="Struktur Organisasi"
                                                    href="/organisasi"
                                                />
                                            </HStack>
                                        </VStack>

                                        <div className="lg:col-span-5 flex items-center justify-center p-8 bg-surface border border-border rounded-3xl relative overflow-hidden group shadow-lg">
                                            <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                                            <VStack gap={4} className="w-full relative z-10 text-center items-center">
                                                <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                                                    <Image src={s.images.find(img => !img.overlay)?.src || '/hmpstrpl.webp'} alt={s.images.find(img => !img.overlay)?.alt || 'TRPL'} width={100} height={100} priority />
                                                </div>
                                                <Heading level={2} className="text-primary font-sans text-lg">
                                                    D4 TRPL Polmed
                                                </Heading>
                                                <Text type="body" color="secondary" className="font-sans leading-relaxed text-justify">
                                                    Mencetak Software Engineer kelas dunia dengan konsentrasi Fullstack, Mobile Development, DevOps, dan Kecerdasan Buatan.
                                                </Text>
                                                <HStack gap={2} wrap="wrap" className="mt-2 justify-center">
                                                    <Badge variant="neutral" label="D4 TRPL" />
                                                    <Badge variant="neutral" label="Software Engineering" />
                                                </HStack>
                                            </VStack>
                                        </div>
                                    </div>
                                )}

                                {/* 2. ABOUT SLIDE (1, 0) */}
                                {s.id === 'about' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                <Badge variant="blue" label={s.badge} />
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Ketuk layar sebelah kanan untuk lanjut &rarr;</Text>
                                        </HStack>
                                        <Divider />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            <VStack gap={4} align="start">
                                                <Heading level={2} className="text-accent font-sans text-lg">Himpunan Mahasiswa Program Studi</Heading>
                                                <Text type="body" color="secondary" className="font-sans leading-relaxed text-justify">
                                                    {s.description}
                                                </Text>
                                                <HStack gap={4} className="mt-4">
                                                    <VStack gap={0.5} align="start">
                                                        <Text type="body" weight="bold" className="text-primary text-xl">2021</Text>
                                                        <Text type="supporting" color="secondary" className="text-xs uppercase">Tahun Berdiri</Text>
                                                    </VStack>
                                                    <VStack gap={0.5} align="start">
                                                        <Text type="body" weight="bold" className="text-primary text-xl">100+</Text>
                                                        <Text type="supporting" color="secondary" className="text-xs uppercase">Mahasiswa Aktif</Text>
                                                    </VStack>
                                                    <VStack gap={0.5} align="start">
                                                        <Text type="body" weight="bold" className="text-primary text-xl">3</Text>
                                                        <Text type="supporting" color="secondary" className="text-xs uppercase">Divisi Utama</Text>
                                                    </VStack>
                                                </HStack>
                                            </VStack>

                                            <Card variant="muted" padding={3} className="flex flex-col gap-4">
                                                <HStack gap={2} align="center">
                                                    <CiLocationOn className="text-lg text-accent" />
                                                    <Heading level={3} className="text-primary font-sans text-sm font-semibold">Lokasi Sekretariat</Heading>
                                                </HStack>
                                                <Text type="body" color="secondary" className="font-sans text-sm leading-relaxed text-justify">
                                                    Kampus Politeknik Negeri Medan, Gedung N Lantai 1, Jl. Almamater No. 1, Medan, Sumatera Utara.
                                                </Text>
                                                <div className="w-full aspect-[3/1] sm:aspect-[2/1] rounded-xl overflow-hidden border border-border relative bg-muted/20">
                                                    <iframe
                                                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1991.0532524441335!2d98.655627!3d3.5629470000000003!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30312fde5e3db891%3A0x74ffef59fb4ac51!2sJl.%20Almamater%2C%20Padang%20Bulan%2C%20Kec.%20Medan%20Baru%2C%20Kota%20Medan%2C%20Sumatera%20Utara!5e0!3m2!1sid!2sid!4v1783227056248!5m2!1sid!2sid"
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        allowFullScreen={false}
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </Card>
                                        </div>
                                    </VStack>
                                )}

                                {/* 3. VISI MISI SLIDE (1, 1) */}
                                {s.id === 'visi-misi' && (
                                    <VStack gap={4} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                <Badge variant="blue" label={s.badge} />
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Slide {index + 1} dari {slides.length}</Text>
                                        </HStack>
                                        <Divider />

                                        {/* Mobile Visi Misi Tab Switcher */}
                                        <div className="md:hidden flex justify-center mb-1">
                                            <SegmentedControl
                                                label="Visi Misi Selection"
                                                value={visiMisiTab}
                                                onChange={(val: string) => setVisiMisiTab(val as any)}
                                                size="sm"
                                            >
                                                <SegmentedControlItem value="visi" label="Visi Utama" />
                                                <SegmentedControlItem value="misi" label="Misi Strategis" />
                                            </SegmentedControl>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            {/* Visi Column */}
                                            <div className={`md:col-span-5 ${isMobile && visiMisiTab !== 'visi' ? 'hidden' : 'block'}`}>
                                                <Card variant="default" padding={isMobile ? 4 : 6} className="h-full flex flex-col justify-between border-l-4 border-l-accent">
                                                    <VStack gap={3} align="start">
                                                        <Badge variant="info" label="Visi Utama" />
                                                        <Heading level={2} className="text-primary font-sans text-lg md:text-xl mt-2">Pilar Visi</Heading>
                                                        <Text type="body" color="secondary" className="font-sans leading-relaxed text-justify text-sm">
                                                            {s.bullets[0] || 'Menjadikan HMPS TRPL Polmed sebagai pusat pengembangan akademik, kepemimpinan, dan kreativitas mahasiswa yang unggul, berintegritas, serta berdaya saing global.'}
                                                        </Text>
                                                    </VStack>
                                                    <div className="mt-6 pt-4 border-t border-border">
                                                        <Link href="/page/visi-misi" className="text-xs font-semibold text-accent hover:text-primary transition-colors decoration-none font-sans">
                                                            Halaman Profil Visi &rarr;
                                                        </Link>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Misi Column */}
                                            <div className={`md:col-span-5 ${isMobile && visiMisiTab !== 'misi' ? 'hidden' : 'block'}`}>
                                                <Card variant="default" padding={isMobile ? 4 : 6} className="h-full flex flex-col justify-between">
                                                    <VStack gap={4} align="stretch">
                                                        <Heading level={2} className="text-primary font-sans text-lg md:text-xl">Misi Strategis</Heading>
                                                        <VStack gap={3} align="stretch">
                                                            {(s.bullets.length > 1 ? s.bullets.slice(1) : [
                                                                'HMPS yang bersih, mengayomi serta terbuka dalam menampung semua aspirasi mahasiswa.',
                                                                'Mengembangkan sumber daya manusia yang terampil, profesional, dan toleransi.',
                                                                'Membangun internal berdasarkan kekeluargaan demi mewujudkan solidaritas mahasiswa.'
                                                            ]).map((bullet, bulletIdx) => (
                                                                <HStack key={bulletIdx} gap={3} align="start">
                                                                    <span className="text-accent text-sm font-bold">{bulletIdx + 1}.</span>
                                                                    <Text type="body" color="secondary" className="font-sans text-xs md:text-sm leading-relaxed text-justify">
                                                                        {bullet}
                                                                    </Text>
                                                                </HStack>
                                                            ))}
                                                        </VStack>
                                                    </VStack>
                                                    <div className="mt-6 pt-4 border-t border-border">
                                                        <Link href="/page/sejarah-hmps" className="text-xs font-semibold text-accent hover:text-primary transition-colors decoration-none font-sans">
                                                            Baca Sejarah Organisasi &rarr;
                                                        </Link>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Sticker Space (right column) — sticker rendered by overlay system on click */}
                                            <div className="md:col-span-2 hidden md:flex flex-col items-center justify-center">
                                                {s.images.filter(img => img.overlay).length === 0 && (
                                                    <div className="w-[80px] h-[80px] rounded-xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1 opacity-20 select-none">
                                                        <span className="text-xl">🖼</span>
                                                        <span className="text-[9px] text-secondary font-mono text-center leading-tight">stiker</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </VStack>
                                )}

                                {/* 4. Fallback / Generic Slide Layout */}
                                {s.id !== 'hero' && s.id !== 'about' && s.id !== 'visi-misi' && s.id !== 'divisions' && s.id !== 'articles' && s.id !== 'meme' && s.id !== 'join' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                {s.badge && <Badge variant="blue" label={s.badge} />}
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Slide {index + 1} dari {slides.length}</Text>
                                        </HStack>
                                        <Divider />
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-4">
                                            <div className="md:col-span-8">
                                                <Card variant="default" padding={6} className="border-l-4 border-l-accent">
                                                    <VStack gap={4} align="start">
                                                        <Text type="large" color="secondary" className="font-sans leading-relaxed text-justify">
                                                            {s.description}
                                                        </Text>
                                                        {s.bullets.length > 0 && (
                                                            <VStack gap={3} align="stretch" className="w-full">
                                                                {s.bullets.map((bullet, bulletIdx) => (
                                                                    <HStack key={bulletIdx} gap={3} align="start">
                                                                        <span className="text-accent font-bold">&bull;</span>
                                                                        <Text type="body" color="secondary" className="font-sans text-sm">
                                                                            {bullet}
                                                                        </Text>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        )}
                                                    </VStack>
                                                </Card>
                                            </div>
                                            <div className="md:col-span-4 hidden md:flex flex-col gap-4">
                                                <Card variant="muted" padding={5} className="text-center">
                                                    <VStack gap={3} align="center">
                                                        <span className="text-4xl">🚀</span>
                                                        <Heading level={3} className="text-primary text-sm font-bold">Gabung Sekarang</Heading>
                                                        <Text type="body" color="secondary" className="font-sans text-xs">
                                                            Tingkatkan kompetensi rekayasa perangkat lunak Anda dan bangun relasi.
                                                        </Text>
                                                        {/* <button
                                                            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-accent text-on-accent hover:brightness-110 active:scale-95 border-0 font-sans"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSlideIndex(0); // Jump back to Hero slide
                                                            }}
                                                        >
                                                            Kembali ke Awal
                                                        </button> */}
                                                    </VStack>
                                                </Card>
                                            </div>
                                        </div>
                                    </VStack>
                                )}

                                {/* 4.5. JOIN COMMUNITY SLIDE (2, 2) */}
                                {s.id === 'join' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                <Badge variant="blue" label={s.badge} />
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Slide {index + 1} dari {slides.length}</Text>
                                        </HStack>
                                        <Divider />
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                                            {/* Left Text / Info Panel */}
                                            <div className="md:col-span-3 flex flex-col justify-between">
                                                <Card variant="default" padding={5} className="h-full flex flex-col justify-between border-l-4 border-l-accent">
                                                    <VStack gap={3} align="start">
                                                        <Badge variant="info" label="Komunitas" />
                                                        <Heading level={3} className="text-primary font-sans text-md font-bold mt-1">Ayo Terhubung!</Heading>
                                                        <Text type="body" color="secondary" className="font-sans text-xs leading-relaxed text-justify">
                                                            {s.description}
                                                        </Text>
                                                    </VStack>
                                                    <div className="mt-6 pt-3 border-t border-border/50">
                                                        <span className="text-[10px] text-disabled font-mono block">HMPS TRPL POLMED</span>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Center Social Cards Grid */}
                                            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {[
                                                    {
                                                        name: 'Discord Server',
                                                        desc: 'Grup obrolan & forum belajar pemrograman',
                                                        icon: <FaDiscord className="text-xl text-[#5865F2]" />,
                                                        link: 'https://discord.gg/svvTAV3Bkp',
                                                        btn: 'Join Discord',
                                                        color: 'hover:border-[#5865F2]/40'
                                                    },
                                                    {
                                                        name: 'GitHub',
                                                        desc: 'Kolaborasi kode & proyek open source prodi',
                                                        icon: <FaGithub className="text-xl text-primary" />,
                                                        link: 'https://github.com/hmpstrplpolmed',
                                                        btn: 'Lihat Repositori',
                                                        color: 'hover:border-primary/40'
                                                    },
                                                    {
                                                        name: 'Instagram',
                                                        desc: 'Dokumentasi kegiatan, info & konten kreatif',
                                                        icon: <FaInstagram className="text-xl text-[#E1306C]" />,
                                                        link: 'https://www.instagram.com/hmpstrpl.polmed',
                                                        btn: 'Follow Instagram',
                                                        color: 'hover:border-[#E1306C]/40'
                                                    },
                                                    {
                                                        name: 'YouTube',
                                                        desc: 'Video rekaman, live-session & webinar internal',
                                                        icon: <FaYoutube className="text-xl text-[#FF0000]" />,
                                                        link: 'https://www.youtube.com/@hmpstrpl',
                                                        btn: 'Subscribe YT',
                                                        color: 'hover:border-[#FF0000]/40'
                                                    },
                                                    {
                                                        name: 'Facebook Page',
                                                        desc: 'Profil, artikel update & publikasi eksternal',
                                                        icon: <FaFacebook className="text-xl text-[#1877F2]" />,
                                                        link: 'https://www.facebook.com/profile.php?id=100092675274229',
                                                        btn: 'Follow Facebook',
                                                        color: 'hover:border-[#1877F2]/40'
                                                    },
                                                    {
                                                        name: 'WhatsApp',
                                                        desc: 'Konsultasi dengan Humas HMPS TRPL ',
                                                        icon: <FaWhatsapp className="text-xl text-[#25D366]" />,
                                                        link: 'https://api.whatsapp.com/send?phone=62882016842676',
                                                        btn: 'Hubungi Kami',
                                                        color: 'hover:border-[#25D366]/40'
                                                    }
                                                ].map((social, socialIdx) => (
                                                    <Card
                                                        key={socialIdx}
                                                        variant="muted"
                                                        padding={isMobile ? 2 : 3}
                                                        className={`flex flex-col justify-between h-full border border-transparent transition-all duration-300 ${social.color} ${socialIdx >= 3 ? 'hidden sm:flex' : 'flex'}`}
                                                    >
                                                        <VStack gap={isMobile ? 1 : 2} align="start">
                                                            <div className="p-1.5 rounded-lg bg-surface/50 flex items-center justify-center">
                                                                {social.icon}
                                                            </div>
                                                            <Heading level={3} className="text-primary text-[11px] md:text-xs font-bold font-sans mt-0.5">{social.name}</Heading>
                                                            <Text type="body" color="secondary" className="font-sans text-[10px] leading-normal text-justify hidden sm:block">
                                                                {social.desc}
                                                            </Text>
                                                        </VStack>
                                                        <div className="mt-2 pt-1.5 border-t border-border/30">
                                                            <a
                                                                href={social.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[10px] font-bold text-accent hover:text-primary transition-colors decoration-none font-sans flex items-center gap-1"
                                                            >
                                                                {social.btn} &rarr;
                                                            </a>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>

                                            {/* Right Column Sticker Placeholder space */}
                                            <div className="md:col-span-2 hidden md:flex flex-col items-center justify-center relative">
                                                {s.images.filter(img => img.overlay).length === 0 && (
                                                    <div className="w-[80px] h-[80px] rounded-xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1 opacity-20 select-none">
                                                        <span className="text-xl">🖼</span>
                                                        <span className="text-[9px] text-secondary font-mono text-center leading-tight">stiker</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </VStack>
                                )}

                                {/* 5. DIVISIONS SLIDE (1, 3) */}
                                {s.id === 'divisions' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                <Badge variant="blue" label={s.badge} />
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Slide {index + 1} dari {slides.length}</Text>
                                        </HStack>
                                        <Divider />
                                        <Text type="body" color="secondary" className="font-sans max-w-xl text-justify text-sm leading-relaxed hidden md:block">
                                            {s.description}
                                        </Text>

                                        {/* Mobile Division Tab Switcher */}
                                        <div className="md:hidden flex justify-center mt-1">
                                            <SegmentedControl
                                                label="Division Selection"
                                                value={divisionTab}
                                                onChange={(val: string) => setDivisionTab(val as any)}
                                                size="sm"
                                            >
                                                <SegmentedControlItem value="ph" label="PH" />
                                                <SegmentedControlItem value="iptek" label="IPTEK" />
                                                <SegmentedControlItem value="humas" label="Humas" />
                                            </SegmentedControl>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                            {[
                                                {
                                                    name: 'Pengurus Harian (PH)',
                                                    desc: 'Memimpin, mengoordinasi, dan mengawasi sirkulasi dokumen, arus keuangan kas, serta menyusun rencana strategis organisasi.',
                                                    badge: 'Utama',
                                                    color: 'neutral' as const
                                                },
                                                {
                                                    name: 'Divisi IPTEK',
                                                    desc: 'Mengembangkan kompetensi keilmuan, riset perangkat lunak, bootcamps pemrograman, serta mengasah keterampilan teknis anggota.',
                                                    badge: 'Keilmuan',
                                                    color: 'blue' as const
                                                },
                                                {
                                                    name: 'Divisi Humas & Pengabdian',
                                                    desc: 'Membangun jejaring alumni & industri IT, mengelola komunikasi publik media sosial, serta menginisiasi bakti sosial masyarakat.',
                                                    badge: 'Eksternal',
                                                    color: 'green' as const
                                                }
                                            ].map((div, divIdx) => (
                                                <Card
                                                    key={divIdx}
                                                    variant="muted"
                                                    padding={3}
                                                    className={`flex flex-col justify-between h-full ${isMobile && (
                                                        (divIdx === 0 && divisionTab !== 'ph') ||
                                                        (divIdx === 1 && divisionTab !== 'iptek') ||
                                                        (divIdx === 2 && divisionTab !== 'humas')
                                                    ) ? 'hidden' : 'flex'
                                                        }`}
                                                >
                                                    <VStack gap={3} align="start">
                                                        <Badge variant={div.color} label={div.badge} />
                                                        <Heading level={3} className="text-primary mt-2 text-md font-bold">{div.name}</Heading>
                                                        <Text type="body" color="secondary" className="font-sans text-xs leading-relaxed text-justify">
                                                            {div.desc}
                                                        </Text>
                                                    </VStack>
                                                    <div className="mt-6 pt-3 border-t border-border/50">
                                                        <Link
                                                            href={`/organisasi/2024-2025/${div.name.toLowerCase().includes('harian') ? 'ph' : div.name.toLowerCase().includes('iptek') ? 'iptek' : 'humas'}`}
                                                            className="text-xs font-semibold text-accent hover:text-primary transition-colors decoration-none font-sans"
                                                        >
                                                            Lihat Roster Staff &rarr;
                                                        </Link>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </VStack>
                                )}

                                {/* 6. ARTICLES SLIDE (1, 4) */}
                                {s.id === 'articles' && (
                                    <VStack gap={6} align="stretch">
                                        <HStack justify="between" align="end">
                                            <VStack gap={1} align="start">
                                                <Badge variant="blue" label={s.badge} />
                                                <Heading level={1} className="text-primary font-sans">{s.title}</Heading>
                                            </VStack>
                                            <Text type="supporting" color="disabled" className="text-xs font-mono">Slide {index + 1} dari {slides.length}</Text>
                                        </HStack>
                                        <Divider />

                                        {loading ? (
                                            <div className="flex items-center justify-center py-20">
                                                <Spinner size="lg" />
                                            </div>
                                        ) : posts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {posts.slice(0, isMobile ? 1 : 3).map((post) => (
                                                    <ClickableCard
                                                        key={post.id}
                                                        label={`Baca artikel: ${post.title}`}
                                                        href={`/blog/${post.slug}`}
                                                        variant="default"
                                                        padding={5}
                                                        className="flex flex-col gap-3 h-full justify-between font-sans"
                                                    >
                                                        {getPostThumbnail(post) && (
                                                            <div className="w-full aspect-[2/1] rounded-xl overflow-hidden border border-border bg-muted/20">
                                                                <img
                                                                    src={getPostThumbnail(post)!}
                                                                    alt={post.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <VStack gap={3} align="start">
                                                            <HStack justify="between" align="center" className="w-full">
                                                                <Badge variant="blue" label={post.category?.name || 'Berita'} />
                                                                <Text type="supporting" color="secondary" className="text-xs">
                                                                    {new Date(post.published_at).toLocaleDateString('id-ID', {
                                                                        day: 'numeric',
                                                                        month: 'short'
                                                                    })}
                                                                </Text>
                                                            </HStack>
                                                            <Heading level={3} className="text-primary font-sans text-sm font-bold mt-1 line-clamp-2">
                                                                {post.title}
                                                            </Heading>
                                                            <Text type="body" color="secondary" className="font-sans text-xs leading-relaxed line-clamp-3 text-justify">
                                                                {post.excerpt}
                                                            </Text>
                                                        </VStack>
                                                        <div className="mt-4 pt-3 border-t border-border text-xs text-secondary flex justify-between items-center font-sans w-full">
                                                            <span>Oleh: {post.user?.name || 'Admin'}</span>
                                                            <span className="font-medium text-accent">Baca &rarr;</span>
                                                        </div>
                                                    </ClickableCard>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
                                                <Text type="body" color="secondary" className="font-sans">
                                                    Belum ada artikel atau kabar yang dipublikasikan.
                                                </Text>
                                            </div>
                                        )}

                                        <div className="flex justify-center mt-4">
                                            <Button
                                                variant="secondary"
                                                size="md"
                                                label="Kunjungi Portal Blog Lengkap"
                                                href="/blog"
                                            />
                                        </div>
                                    </VStack>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Slide Navigation Pagination Indicators (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
                {slides.map((s, idx) => {
                    const isActive = idx === slideIndex;
                    return (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSlideIndex(idx);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${isActive ? 'w-6 bg-accent' : 'w-2 bg-border/50 hover:bg-border'
                                }`}
                            title={`Buka slide ${idx + 1}`}
                        />
                    );
                })}
            </div>

            {/* Floating Copyright / branding label (Bottom Left) */}
            <div className="absolute bottom-6 left-6 z-50 hidden md:block">
                <Text type="supporting" color="disabled" className="text-[10px] font-mono uppercase tracking-widest">
                    © 2026 HMPS TRPL Polmed
                </Text>
            </div>

        </div>
    );
};