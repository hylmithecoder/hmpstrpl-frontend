'use client';

import { useEffect, useState } from 'react';
import {
    HStack,
    VStack,
    Heading,
    Text,
    Badge,
    Card,
    Avatar
} from '@astryxdesign/core';
import { resolvePhoto, type ManagementYear, type Member } from '../../utils/api';
import Link from 'next/link';

interface StrukturOrganisasiProps {
    periode: string;
    years: ManagementYear[];
    structure: ManagementYear;
}

// Match BPH/PH as the executive board division — alias can be 'ph', 'bph', or 'pengurus-harian'
const PH_ALIASES = ['ph', 'bph', 'pengurus-harian', 'pengurus-harian-bph'];

function MemberCard({ member, highlight, showBio }: { member: Member; highlight?: boolean; showBio?: boolean }) {
    return (
        <Card
            variant="default"
            padding={4}
            className={`text-center h-full ${highlight ? 'border-t-4 border-t-accent' : ''}`}
        >
            <VStack gap={3} align="center">
                <Avatar name={member.name} size={highlight ? 144 : 128} src={resolvePhoto(member.photo)} />
                <VStack gap={1}>
                    <Text type="body" weight="bold" className="text-primary font-sans leading-tight">{member.name}</Text>
                    <Badge variant={highlight ? 'blue' : 'neutral'} label={member.position?.name || 'Anggota'} />
                </VStack>
                {showBio && member.bio && (
                    <Text type="supporting" color="secondary" className="font-sans max-w-xs">{member.bio}</Text>
                )}
                {member.nim && (
                    <Text type="supporting" color="disabled" className="text-xs font-mono">NIM. {member.nim}</Text>
                )}
            </VStack>
        </Card>
    );
}

export default function StrukturOrganisasi({ periode, years, structure }: StrukturOrganisasiProps) {
    const divisions = structure.divisions || [];
    const phDivision = divisions.find(d => PH_ALIASES.includes(d.alias.toLowerCase()));
    const defaultAlias = phDivision?.alias ?? divisions[0]?.alias ?? '';

    const [selected, setSelected] = useState(defaultAlias);

    // Sync selection with the URL fragment so each division is deep-linkable,
    // e.g. /organisasi/2024-2025#ilmu-pengetahun-dan-teknologi
    useEffect(() => {
        const applyHash = () => {
            const hash = decodeURIComponent(window.location.hash.slice(1));
            if (hash && (structure.divisions || []).some(d => d.alias === hash)) {
                setSelected(hash);
            }
        };
        applyHash();
        window.addEventListener('hashchange', applyHash);
        return () => window.removeEventListener('hashchange', applyHash);
    }, [structure]);

    const selectDivision = (alias: string) => {
        setSelected(alias);
        history.replaceState(null, '', `#${encodeURIComponent(alias)}`);
    };

    const activeDivision = divisions.find(d => d.alias === selected) ?? divisions[0];
    const isPH = activeDivision ? PH_ALIASES.includes(activeDivision.alias.toLowerCase()) : false;
    const members = activeDivision?.members ?? [];

    // Executive board extraction for the PH tree layout
    const ketua = members.find(m => m.position?.name.toLowerCase().includes('ketua umum') || m.position?.name.toLowerCase() === 'ketua');
    const wakil = members.find(m => m.position?.name.toLowerCase().includes('wakil ketua'));
    const sekretaris = members.find(m => m.position?.name.toLowerCase().includes('sekretaris'));
    const bendahara = members.find(m => m.position?.name.toLowerCase().includes('bendahara'));
    const otherPh = members.filter(m =>
        m.uuid !== ketua?.uuid && m.uuid !== wakil?.uuid && m.uuid !== sekretaris?.uuid && m.uuid !== bendahara?.uuid
    );

    // Division head extraction for the regular division layout
    const kadiv = members.find(m => m.position?.name.toLowerCase().includes('kepala') || m.position?.name.toLowerCase().includes('kadiv') || m.position?.name.toLowerCase().includes('koordinator'));
    const staff = members.filter(m => m.uuid !== kadiv?.uuid);

    return (
        <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
            <VStack gap={6} align="stretch">

                {/* Header & Period Switcher */}
                <HStack justify="center" align="end" wrap="wrap" gap={4} className="border-b border-border pb-8">
                    <VStack gap={1}>
                        <Heading level={1} type="display-1" className="text-primary text-center font-sans">
                            Struktur Organisasi
                        </Heading>
                        <Text type="body" color="secondary" className="font-sans">
                            Daftar pengurus aktif HMPS TRPL Politeknik Negeri Medan Periode {structure.start_year}/{structure.end_year}.
                        </Text>
                    </VStack>
                </HStack>

                {/* Division Pills Selector */}
                {divisions.length > 0 && (
                    <HStack gap={2} wrap="wrap" justify="center">
                        {divisions.map((div) => {
                            const isActive = div.alias === activeDivision?.alias;
                            return (
                                <button
                                    key={div.id}
                                    onClick={() => selectDivision(div.alias)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer font-sans ${isActive
                                        ? 'bg-accent text-on-accent border border-accent'
                                        : 'bg-surface border border-border text-primary hover:bg-muted/30'
                                        }`}
                                >
                                    {div.name}
                                </button>
                            );
                        })}
                    </HStack>
                )}

                {/* Active Division Content */}
                {activeDivision && (
                    <section className="py-2">
                        <VStack gap={3} align="stretch">
                            <div className="text-center max-w-md mx-auto">
                                <div>
                                    <Link
                                        href={`/organisasi/${periode}/${activeDivision.alias}`}
                                        className="text-xs font-semibold text-accent hover:underline font-sans"
                                    >
                                        Lihat Halaman Divisi →
                                    </Link>
                                </div>
                            </div>

                            {members.length === 0 ? (
                                <div className="flex items-center justify-center p-10 border border-dashed border-border rounded-xl bg-muted/10">
                                    <Text type="supporting" color="secondary" className="font-sans">Belum ada anggota terdaftar di divisi ini.</Text>
                                </div>
                            ) : isPH ? (
                                /* Executive board tree layout */
                                <VStack gap={6} align="center" className="w-full">
                                    <div className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-2xl">
                                        {ketua && <div className="flex-1"><MemberCard member={ketua} highlight showBio /></div>}
                                        {wakil && <div className="flex-1"><MemberCard member={wakil} highlight showBio /></div>}
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-center gap-6 w-full max-w-2xl">
                                        {sekretaris && <div className="flex-1"><MemberCard member={sekretaris} /></div>}
                                        {bendahara && <div className="flex-1"><MemberCard member={bendahara} /></div>}
                                    </div>
                                    {otherPh.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
                                            {otherPh.map((m) => <MemberCard key={m.uuid} member={m} />)}
                                        </div>
                                    )}
                                </VStack>
                            ) : (
                                /* Regular division layout: head + staff grid */
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {kadiv && (
                                        <div className="lg:col-span-1">
                                            <MemberCard member={kadiv} highlight showBio />
                                        </div>
                                    )}
                                    <div className={kadiv ? 'lg:col-span-3' : 'lg:col-span-4'}>
                                        {staff.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {staff.map((m) => <MemberCard key={m.uuid} member={m} />)}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center p-6 border border-dashed border-border rounded-xl h-full bg-muted/10">
                                                <Text type="supporting" color="secondary" className="font-sans">Belum ada anggota staf terdaftar.</Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </VStack>
                    </section>
                )}

                {divisions.length === 0 && (
                    <div className="text-center py-20 bg-surface border border-dashed border-border rounded-2xl">
                        <Text type="body" color="secondary" className="font-sans">
                            Struktur organisasi untuk periode ini tidak ditemukan atau belum diunggah.
                        </Text>
                    </div>
                )}

            </VStack>
        </main>
    );
}
