'use client';

import { useState, useEffect } from 'react';
import { HStack, SegmentedControl, SegmentedControlItem, Text } from '@astryxdesign/core';
import { useThemeMode } from './ThemeProvider';
import Link from 'next/link';
import { API_ORIGIN } from '../utils/api';
import Image from 'next/image';

const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/organisasi', label: 'Kepengurusan' },
    // { href: '/blog', label: 'Kelulusan' },
    { href: '/blog?category=news', label: 'Berita' },
    { href: '/blog?category=article', label: 'Artikel' },
];

const Navbar = () => {
    const { mode, setMode } = useThemeMode();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);

    const [periods, setPeriods] = useState<{ slug: string; label: string }[]>([
        { slug: '2025-2026', label: '2025/2026' },
        { slug: '2024-2025', label: '2024/2025' },
        { slug: '2023-2024', label: '2023/2024' },
        { slug: '2022-2023', label: '2022/2023' },
    ]);

    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const res = await fetch(`${API_ORIGIN}/api/v1/management-years`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        const formatted = json.data.map((y: any) => ({
                            slug: y.slug || `${y.start_year}-${y.end_year}`,
                            label: `${y.start_year}/${y.end_year}`
                        }));
                        formatted.sort((a: any, b: any) => b.slug.localeCompare(a.slug));
                        setPeriods(formatted);
                    }
                }
            } catch (error) {
                console.warn('Navbar: Failed to fetch management-years from API, using default periods.');
            }
        };
        loadPeriods();
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/85 backdrop-blur-md transition-colors duration-250">
            <div className="mx-auto max-w-6xl px-6 py-4">
                <HStack justify="between" align="center" gap={3}>
                    {/* Logo / Brand */}
                    <Link href="/" className="flex items-center gap-2 group decoration-none">
                        <Image src="/hmpstrpl.webp" alt="HMPS TRPL" width={32} height={32} />
                        <Text type="large" weight="bold" className="text-primary font-sans">
                            HMPS<span className="font-bold"> TRPL</span>
                            <span className="font-bold text-sm block">Politeknik Negeri Medan</span>
                        </Text>
                    </Link>

                    {/* Navigation Links — desktop only */}
                    <nav className="hidden md:flex items-center gap-6 font-sans">
                        {NAV_LINKS.map((item) => (
                            <div
                                key={item.href}
                                className="relative py-2"
                                onMouseEnter={() => item.label === 'Kepengurusan' && setDropdownOpen(true)}
                                onMouseLeave={() => item.label === 'Kepengurusan' && setDropdownOpen(false)}
                            >
                                {item.label === 'Kepengurusan' ? (
                                    <>
                                        <button className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
                                            {item.label}
                                            <span className={`text-[8px] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                                        </button>

                                        {/* Dropdown Menu Box */}
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 min-w-[160px] rounded-xl border border-border bg-surface shadow-xl backdrop-blur-md transition-all duration-200 origin-top ${dropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                                            <div className="py-2 flex flex-col">
                                                {periods.map((p) => (
                                                    <Link
                                                        key={p.slug}
                                                        href={`/organisasi/${p.slug}`}
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-muted/40 transition-colors decoration-none text-center"
                                                    >
                                                        {p.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link href={item.href} className="text-sm font-medium text-secondary hover:text-primary transition-colors decoration-none">
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Right side: theme switcher (desktop) + hamburger (mobile) */}
                    <HStack align="center" gap={3}>
                        {/* Theme switcher — desktop only */}
                        <div className="hidden md:flex items-center">
                            <SegmentedControl
                                label="Theme Selection"
                                value={mode}
                                onChange={(val) => setMode(val as any)}
                                size="sm"
                            >
                                <SegmentedControlItem value="light" label="Light" />
                                <SegmentedControlItem value="system" label="System" />
                                <SegmentedControlItem value="dark" label="Dark" />
                            </SegmentedControl>
                        </div>

                        {/* Hamburger — mobile only */}
                        <button
                            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                        >
                            <span className={`block w-5 h-0.5 bg-primary transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-primary transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-primary transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                        </button>
                    </HStack>
                </HStack>
            </div>

            {/* Mobile dropdown menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-96 border-t border-border' : 'max-h-0'}`}>
                <nav className="flex flex-col px-6 py-2 gap-1 bg-surface/95">
                    {NAV_LINKS.map((item) => (
                        item.label === 'Kepengurusan' ? (
                            <div key={item.href} className="flex flex-col">
                                <button
                                    onClick={() => setMobileSubmenuOpen(prev => !prev)}
                                    className="flex justify-between items-center text-sm font-medium text-secondary hover:text-primary hover:bg-muted/30 transition-colors px-3 py-2 rounded-lg bg-transparent border-none text-left cursor-pointer w-full outline-none"
                                >
                                    <span>{item.label}</span>
                                    <span className={`text-[8px] transition-transform duration-200 ${mobileSubmenuOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ${mobileSubmenuOpen ? 'max-h-60' : 'max-h-0'}`}>
                                    <div className="pl-6 py-1 flex flex-col gap-1 border-l border-border/50 ml-4 mt-1 mb-2">
                                        {periods.map((p) => (
                                            <Link
                                                key={p.slug}
                                                href={`/organisasi/${p.slug}`}
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    setMobileSubmenuOpen(false);
                                                }}
                                                className="text-xs font-medium text-secondary hover:text-primary py-1.5 decoration-none"
                                            >
                                                {p.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="text-sm font-medium text-secondary hover:text-primary hover:bg-muted/30 transition-colors decoration-none px-3 py-2 rounded-lg"
                            >
                                {item.label}
                            </Link>
                        )
                    ))}

                    {/* Theme switcher inside mobile menu */}
                    <div className="pt-3 mt-1 border-t border-border/50 px-3 pb-2">
                        <span className="text-[10px] text-disabled font-mono uppercase block mb-2">Tampilan</span>
                        <SegmentedControl
                            label="Theme Selection"
                            value={mode}
                            onChange={(val) => { setMode(val as any); }}
                            size="sm"
                        >
                            <SegmentedControlItem value="light" label="Light" />
                            <SegmentedControlItem value="system" label="System" />
                            <SegmentedControlItem value="dark" label="Dark" />
                        </SegmentedControl>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;