'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { VStack, HStack, Heading, Text, Card, Button, TextInput, Divider, Badge, Spinner } from '@astryxdesign/core';
import {
    fetchInstagramStatus,
    fetchInstagramAuthUrl,
    exchangeInstagramCode,
    refreshInstagramToken,
    fetchInstagramFeed,
    instagramCover,
    instagramTitle,
    formatInstagramDate,
    isInstagramReel,
    type InstagramStatus,
    type InstagramAuthUrl,
    type InstagramMedia,
    INSTAGRAM_REDIRECT_URI,
    instagramEmbedUrl,
    fetchInstagramCollabLinks,
    saveInstagramCollabLinks,
} from '../../utils/api';

interface InstagramTabProps {
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

// The OAuth redirect must match, character for character, a URI registered in
// the Meta app dashboard — otherwise Instagram answers "Invalid redirect_uri".
// It defaults to this dashboard's own origin and can be overridden with
// NEXT_PUBLIC_IG_REDIRECT_URI when the registered URI is a different host.
function dashboardRedirectUri(): string {
    if (INSTAGRAM_REDIRECT_URI) return INSTAGRAM_REDIRECT_URI;
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/dashboard`;
}

export default function InstagramTab({ setBanner }: InstagramTabProps) {
    const [status, setStatus] = useState<InstagramStatus | null>(null);
    const [auth, setAuth] = useState<InstagramAuthUrl | null>(null);
    const [preview, setPreview] = useState<InstagramMedia[]>([]);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<null | 'auth' | 'exchange' | 'refresh'>(null);

    const [collabLinks, setCollabLinks] = useState<string[]>([]);
    const [collabInput, setCollabInput] = useState('');
    const [savingCollab, setSavingCollab] = useState(false);

    const [code, setCode] = useState('');
    const [manualToken, setManualToken] = useState('');
    const [showManual, setShowManual] = useState(false);

    const loadStatus = useCallback(async () => {
        const res = await fetchInstagramStatus();
        if (res.success && res.data) setStatus(res.data);
        else setStatus({ connected: false, message: res.message });
    }, []);

    const loadPreview = useCallback(async () => {
        const { feed, error } = await fetchInstagramFeed(6, 'all', { noStore: true });
        setPreview(feed.items);
        setPreviewError(error);
    }, []);

    const linkWithCode = useCallback(async (rawCode: string) => {
        setBusy('exchange');
        const res = await exchangeInstagramCode({ code: rawCode, redirectUri: dashboardRedirectUri() });
        setBusy(null);
        if (res.success) {
            setCode('');
            setBanner('success', res.message || 'Akun Instagram berhasil ditautkan.');
            await Promise.all([loadStatus(), loadPreview()]);
        } else {
            setBanner('error', res.message);
        }
        return res.success;
    }, [setBanner, loadStatus, loadPreview]);

    // Initial load, plus: when Instagram redirects back to /dashboard?code=…,
    // exchange it straight away and strip the code from the address bar.
    useEffect(() => {
        let cancelled = false;
        async function init() {
            const params = new URLSearchParams(window.location.search);
            const redirectedCode = params.get('code');
            if (redirectedCode) {
                params.delete('code');
                const rest = params.toString();
                window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
                await linkWithCode(redirectedCode.replace(/#_$/, ''));
                if (!cancelled) setLoading(false);
                return;
            }
            const [, , links] = await Promise.all([
                loadStatus(),
                loadPreview(),
                fetchInstagramCollabLinks({ noStore: true }),
            ]);
            if (cancelled) return;
            setCollabLinks(links);
            setLoading(false);
        }
        init();
        return () => { cancelled = true; };
    }, [loadStatus, loadPreview, linkWithCode]);

    const handleGenerateAuthUrl = async () => {
        setBusy('auth');
        const res = await fetchInstagramAuthUrl(dashboardRedirectUri());
        setBusy(null);
        if (res.success && res.data) {
            setAuth(res.data);
            window.open(res.data.auth_url, '_blank', 'noopener,noreferrer');
        } else {
            setBanner('error', res.message);
        }
    };

    const handleRefresh = async () => {
        setBusy('refresh');
        const res = await refreshInstagramToken();
        setBusy(null);
        if (res.success) {
            setBanner('success', res.message || 'Token diperpanjang 60 hari.');
            await loadStatus();
        } else {
            setBanner('error', res.message);
        }
    };

    const handleManualToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualToken.trim()) {
            setBanner('error', 'Access token tidak boleh kosong.');
            return;
        }
        setBusy('exchange');
        const res = await exchangeInstagramCode({ access_token: manualToken.trim() });
        setBusy(null);
        if (res.success) {
            setManualToken('');
            setShowManual(false);
            setBanner('success', res.message || 'Access token tersimpan.');
            await Promise.all([loadStatus(), loadPreview()]);
        } else {
            setBanner('error', res.message);
        }
    };

    // Collab posts are stored as one JSON setting, so every change rewrites the
    // whole list; state only advances once the backend confirms the write.
    const persistCollab = async (next: string[], successMsg: string) => {
        setSavingCollab(true);
        const res = await saveInstagramCollabLinks(next);
        setSavingCollab(false);
        if (res.success) {
            setCollabLinks(next);
            setBanner('success', successMsg);
        } else {
            setBanner('error', res.message);
        }
    };

    const handleAddCollab = async (e: React.FormEvent) => {
        e.preventDefault();
        const link = collabInput.trim();
        if (!instagramEmbedUrl(link)) {
            setBanner('error', 'Tautan tidak valid. Gunakan URL postingan Instagram, contoh: https://www.instagram.com/p/ABC123/');
            return;
        }
        if (collabLinks.includes(link)) {
            setBanner('error', 'Tautan tersebut sudah ada di daftar.');
            return;
        }
        await persistCollab([...collabLinks, link], 'Postingan kolaborasi ditambahkan.');
        setCollabInput('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    const connected = !!status?.connected;
    const daysLeft = status?.days_left ?? null;
    const expiringSoon = daysLeft !== null && daysLeft <= 15;
    const redirectUri = dashboardRedirectUri();
    const insecureRedirect = redirectUri.startsWith('http://');

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center" wrap="wrap" gap={3}>
                <Heading level={2} className="text-primary font-sans text-xl">Integrasi Instagram</Heading>
                <Badge
                    variant={connected ? 'green' : 'red'}
                    label={connected ? 'Terhubung' : 'Belum Terhubung'}
                />
            </HStack>

            {/* Connection status */}
            <Card variant={connected ? 'default' : 'muted'} padding={6}>
                <VStack gap={4} align="stretch">
                    {connected ? (
                        <>
                            <VStack gap={1}>
                                <Text type="body" weight="semibold" className="text-primary font-sans">
                                    @{status?.username || 'akun-instagram'}
                                </Text>
                                <Text type="supporting" color="secondary" className="font-sans">
                                    Feed akun ini otomatis tampil di halaman Berita publik (cache 15 menit).
                                </Text>
                            </VStack>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <VStack gap={0.5}>
                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider font-sans">Sisa Masa Aktif</Text>
                                    <Text type="body" weight="semibold" className={`font-sans ${expiringSoon ? 'text-warning' : 'text-primary'}`}>
                                        {daysLeft !== null ? `${daysLeft} hari` : '—'}
                                    </Text>
                                </VStack>
                                <VStack gap={0.5}>
                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider font-sans">Kedaluwarsa</Text>
                                    <Text type="body" weight="semibold" className="text-primary font-sans">
                                        {status?.expires_at ? formatInstagramDate(status.expires_at.replace(' ', 'T')) : '—'}
                                    </Text>
                                </VStack>
                                <VStack gap={0.5}>
                                    <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider font-sans">Token</Text>
                                    <Text type="body" weight="semibold" className="text-primary font-sans font-mono text-xs">
                                        {status?.token_preview || '***'}
                                    </Text>
                                </VStack>
                            </div>

                            {expiringSoon && (
                                <Text type="supporting" className="text-warning font-sans">
                                    Token akan segera kedaluwarsa. Klik &quot;Perpanjang Token&quot; untuk mengatur ulang masa aktif menjadi 60 hari.
                                </Text>
                            )}

                            <HStack gap={3} wrap="wrap">
                                <Button
                                    variant="primary"
                                    size="md"
                                    label={busy === 'refresh' ? 'Memperpanjang…' : 'Perpanjang Token 60 Hari'}
                                    isDisabled={busy !== null}
                                    onClick={handleRefresh}
                                />
                                <Button
                                    variant="secondary"
                                    size="md"
                                    label={busy === 'auth' ? 'Membuka…' : 'Tautkan Ulang Akun'}
                                    isDisabled={busy !== null}
                                    onClick={handleGenerateAuthUrl}
                                />
                            </HStack>
                        </>
                    ) : (
                        <>
                            <VStack gap={1}>
                                <Text type="body" weight="semibold" className="text-primary font-sans">
                                    Belum ada akun Instagram yang tertaut
                                </Text>
                                <Text type="supporting" color="secondary" className="font-sans">
                                    {status?.message || 'Login dengan akun Instagram resmi HMPS TRPL agar feed-nya tampil sebagai Berita di situs publik.'}
                                </Text>
                            </VStack>
                            <div>
                                <Button
                                    variant="primary"
                                    size="md"
                                    label={busy === 'auth' ? 'Membuka…' : 'Hubungkan Akun Instagram'}
                                    isDisabled={busy !== null}
                                    onClick={handleGenerateAuthUrl}
                                />
                            </div>
                        </>
                    )}

                    <Divider />

                    <VStack gap={1.5} align="stretch">
                        <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider font-sans">
                            Redirect URI yang dipakai
                        </Text>
                        <code className="text-xs font-mono text-primary bg-muted/40 px-3 py-2 rounded-lg break-all">
                            {redirectUri || '—'}
                        </code>
                        <Text type="supporting" color="secondary" className="font-sans text-xs">
                            URI ini harus terdaftar persis sama di Meta App Dashboard &rarr; Instagram &rarr; API setup with
                            Instagram login &rarr; Business login settings &rarr; OAuth redirect URIs. Kalau tidak cocok,
                            Instagram menolak dengan pesan <span className="font-mono">Invalid redirect_uri</span>.
                        </Text>
                        {insecureRedirect && (
                            <Text type="supporting" className="text-warning font-sans text-xs">
                                Instagram hanya menerima URI <span className="font-mono">https://</span>. Jalankan dev server
                                dengan <span className="font-mono">npm run dev:https</span>, atau set
                                <span className="font-mono"> NEXT_PUBLIC_IG_REDIRECT_URI</span> ke URL HTTPS yang terdaftar.
                            </Text>
                        )}
                    </VStack>
                </VStack>
            </Card>

            {/* OAuth instructions, shown after generating the auth URL */}
            {auth && (
                <Card variant="muted" padding={6}>
                    <VStack gap={4} align="stretch">
                        <Heading level={3} className="text-primary font-sans text-base">Langkah Penautan</Heading>
                        <ol className="list-decimal pl-5 flex flex-col gap-1.5">
                            {auth.instructions.map((step, i) => (
                                <li key={i} className="text-sm text-secondary font-sans leading-relaxed">
                                    {step.replace(/^\d+\.\s*/, '')}
                                </li>
                            ))}
                        </ol>
                        <a
                            href={auth.auth_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent font-semibold font-sans break-all"
                        >
                            Buka halaman login Instagram &rarr;
                        </a>
                        <Text type="supporting" color="secondary" className="font-sans text-xs">
                            Redirect URI: <span className="font-mono">{auth.redirect_uri}</span> &middot; Graph {auth.graph_version}
                        </Text>
                        <Divider />
                        <Text type="supporting" color="secondary" className="font-sans">
                            Jika halaman ini tidak otomatis menangkap kode setelah redirect, tempel nilai <span className="font-mono">code=</span> dari address bar di bawah ini.
                        </Text>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!code.trim()) {
                                    setBanner('error', 'Kode otorisasi tidak boleh kosong.');
                                    return;
                                }
                                await linkWithCode(code.trim().replace(/#_$/, ''));
                            }}
                            className="flex flex-col sm:flex-row gap-3 sm:items-end"
                        >
                            <div className="flex-1">
                                <TextInput
                                    label="Kode Otorisasi (code)"
                                    placeholder="AQD...#_"
                                    value={code}
                                    onChange={(val) => setCode(val)}
                                    hasClear={true}
                                    width="100%"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                label={busy === 'exchange' ? 'Memproses…' : 'Tukar Kode'}
                                isDisabled={busy !== null}
                            />
                        </form>
                    </VStack>
                </Card>
            )}

            {/* Escape hatch: paste a long-lived token straight from Meta */}
            <Card variant="muted" padding={6}>
                <VStack gap={4} align="stretch">
                    <HStack justify="between" align="center" wrap="wrap" gap={3}>
                        <VStack gap={0.5}>
                            <Text type="body" weight="semibold" className="text-primary font-sans">Input Token Manual</Text>
                            <Text type="supporting" color="secondary" className="font-sans">
                                Alternatif bila OAuth terhalang: tempel Long-Lived Access Token dari Meta Developer.
                            </Text>
                        </VStack>
                        <Button
                            variant="secondary"
                            size="sm"
                            label={showManual ? 'Tutup' : 'Buka Form'}
                            onClick={() => setShowManual(v => !v)}
                        />
                    </HStack>

                    {showManual && (
                        <form onSubmit={handleManualToken} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                            <div className="flex-1">
                                <TextInput
                                    label="Long-Lived Access Token"
                                    placeholder="IGAA..."
                                    value={manualToken}
                                    onChange={(val) => setManualToken(val)}
                                    hasClear={true}
                                    width="100%"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                label={busy === 'exchange' ? 'Menyimpan…' : 'Simpan Token'}
                                isDisabled={busy !== null}
                            />
                        </form>
                    )}
                </VStack>
            </Card>

            {/* Collab posts: owned by a partner account, invisible to /me/media */}
            <Card variant="muted" padding={6}>
                <VStack gap={4} align="stretch">
                    <VStack gap={0.5}>
                        <Text type="body" weight="semibold" className="text-primary font-sans">
                            Postingan Kolaborasi
                        </Text>
                        <Text type="supporting" color="secondary" className="font-sans">
                            Postingan collab dimiliki akun partner, sehingga tidak ikut terambil dari feed.
                            Tempel tautannya di sini agar tetap tampil di halaman Berita sebagai embed resmi Instagram.
                        </Text>
                    </VStack>

                    <form onSubmit={handleAddCollab} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="flex-1">
                            <TextInput
                                label="Tautan Postingan Instagram"
                                placeholder="https://www.instagram.com/p/ABC123/"
                                value={collabInput}
                                onChange={(val) => setCollabInput(val)}
                                hasClear={true}
                                width="100%"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            label={savingCollab ? 'Menyimpan…' : 'Tambahkan'}
                            isDisabled={savingCollab}
                        />
                    </form>

                    {collabLinks.length > 0 && (
                        <VStack gap={2} align="stretch">
                            {collabLinks.map((link) => (
                                <HStack key={link} justify="between" align="center" gap={3} className="border border-border rounded-lg px-3 py-2">
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-mono text-primary break-all decoration-none"
                                    >
                                        {link}
                                    </a>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        label="Hapus"
                                        isDisabled={savingCollab}
                                        onClick={() => persistCollab(
                                            collabLinks.filter(item => item !== link),
                                            'Postingan kolaborasi dihapus.'
                                        )}
                                    />
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </VStack>
            </Card>

            {/* Live preview of what visitors will see */}
            <VStack gap={4} align="stretch">
                <HStack justify="between" align="center" wrap="wrap" gap={3}>
                    <Heading level={3} className="text-primary font-sans text-base">Pratinjau Feed</Heading>
                    <Button variant="secondary" size="sm" label="Muat Ulang" onClick={loadPreview} />
                </HStack>

                {previewError ? (
                    <Card variant="muted" padding={5}>
                        <Text type="supporting" color="secondary" className="font-sans">{previewError}</Text>
                    </Card>
                ) : preview.length === 0 ? (
                    <Card variant="muted" padding={5}>
                        <Text type="supporting" color="secondary" className="font-sans">
                            Belum ada konten pada feed akun ini.
                        </Text>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {preview.map((item) => {
                            const cover = instagramCover(item);
                            return (
                                <a
                                    key={item.id}
                                    href={item.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col gap-2 decoration-none"
                                >
                                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted/20">
                                        {cover && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={cover} alt={instagramTitle(item.caption)} className="w-full h-full object-cover" loading="lazy" />
                                        )}
                                        {isInstagramReel(item) && (
                                            <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                                                REELS
                                            </span>
                                        )}
                                    </div>
                                    <Text type="supporting" color="secondary" className="font-sans text-xs line-clamp-2">
                                        {instagramTitle(item.caption, 60)}
                                    </Text>
                                </a>
                            );
                        })}
                    </div>
                )}
            </VStack>
        </VStack>
    );
}
