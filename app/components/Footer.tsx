'use client';

import React from 'react';
import { HStack, VStack, Text, Divider } from '@astryxdesign/core';
import Image from 'next/image';

const Footer = () => {
    return (
        <footer className="w-full border-t border-border bg-muted/30 py-12 transition-colors duration-250 mt-auto">
            <div className="mx-auto max-w-6xl px-6">
                <VStack gap={6} align="stretch">
                    <HStack justify="between" align="start" wrap="wrap" gap={4}>
                        {/* Brand Left */}
                        <VStack gap={2}>
                            <HStack align="center" gap={2}>
                                <div className="flex h-8 w-8 items-center justify-center rounded text-on-accent font-bold text-sm">
                                    <Image src="/hmpstrpl.webp" alt="" width={36} height={36} />
                                </div>
                                <Text type="body" weight="bold" className="text-primary font-sans">
                                    HMPS TRPL <span className='text-sm block'> Politeknik Negeri Medan </span>
                                </Text>
                            </HStack>
                            <Text type="supporting" color="secondary" className="max-w-xs font-sans">
                                Wadah aspirasi, kolaborasi, dan pengembangan kapasitas ilmiah mahasiswa Teknologi Rekayasa Perangkat Lunak Politeknik Negeri Medan.
                            </Text>
                        </VStack>

                        {/* Links Right */}
                        <HStack gap={8} wrap="wrap">
                            <VStack gap={2}>
                                <Text type="label" weight="bold" className="text-primary">
                                    Situs
                                </Text>
                                <a href="/" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Beranda</a>
                                <a href="/organisasi" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Struktur Organisasi</a>
                                <a href="/blog" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Artikel & Berita</a>
                                <a href="/kontak" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Hubungi Kami</a>
                            </VStack>

                            <VStack gap={2}>
                                <Text type="label" weight="bold" className="text-primary">
                                    Profil
                                </Text>
                                <a href="/page/visi-misi" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Visi & Misi</a>
                                <a href="/page/sejarah-hmps" className="text-xs text-secondary hover:text-primary transition-colors decoration-none font-sans">Sejarah HMPS</a>
                            </VStack>
                        </HStack>
                    </HStack>

                    <Divider />

                    {/* Bottom Copyright */}
                    <HStack justify="between" align="center" wrap="wrap" gap={3}>
                        <Text type="supporting" color="secondary" className="text-xs font-sans">
                            &copy; {new Date().getFullYear()} HMPS TRPL Polmed. All rights reserved.
                        </Text>
                        <HStack gap={3}>
                            <Text type="supporting" color="secondary" className="text-xs font-sans">
                                Made with <span className="text-red-500">❤</span> by IPTEK HMPS TRPL Politeknik Negeri Medan
                            </Text>
                        </HStack>
                    </HStack>
                </VStack>
            </div>
        </footer>
    );
};

export default Footer;