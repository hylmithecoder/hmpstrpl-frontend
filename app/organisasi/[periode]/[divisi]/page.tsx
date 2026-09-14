import React from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import {
  HStack,
  VStack,
  Heading,
  Text,
  Badge,
  Card,
  Avatar,
  Button,
  Divider
} from '@astryxdesign/core';
import { apiFetch, resolvePhoto, type Member } from '../../../utils/api';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ periode: string; divisi: string }>;
}

const isLeaderPosition = (posName?: string) => {
  if (!posName) return false;
  const lower = posName.toLowerCase();
  return lower.includes('ketua') ||
    lower.includes('kepala') ||
    lower.includes('kadiv') ||
    lower.includes('kordinator') ||
    lower.includes('koordinator') ||
    lower.includes('wakil') ||
    lower.includes('sekretaris') ||
    lower.includes('bendahara');
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { periode, divisi } = await params;
  const aliasDisplay = divisi.length <= 4
    ? divisi.toUpperCase()
    : divisi.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${aliasDisplay} HMPS TRPL Politeknik Negeri Medan`,
    description: `Struktur anggota ${aliasDisplay} HMPS TRPL Politeknik Negeri Medan periode ${periode}.`,
  };
}

export default async function DivisiDetailPage({ params }: PageProps) {
  const { periode, divisi } = await params;

  // No mock fallback: an unknown division (404) simply yields an empty roster
  // and renders the "tidak ditemukan" state below.
  const members = await apiFetch<Member[]>(
    `/struktur-organisasi/${periode}/${divisi}`,
    [],
    { noStore: true }
  );

  // Period years: prefer API member payload, then derive from the URL slug (e.g. "2024-2025")
  const [slugStart, slugEnd] = periode.split('-');
  const startYear = members[0]?.managementyear?.start_year ?? slugStart;
  const endYear = members[0]?.managementyear?.end_year ?? slugEnd;

  // Division title: use alias (short name) for heading, full name for subtitle
  const alias = members[0]?.division?.alias || divisi;
  const aliasDisplay = alias.length <= 4
    ? alias.toUpperCase()
    : alias.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const divisionName = aliasDisplay;
  const divisionFullName = members[0]?.division?.name || null;

  const isPH = divisi.toLowerCase() === 'ph' || divisi.toLowerCase() === 'bph' || divisi.toLowerCase().includes('pengurus-harian');
  const divisionDesc = isPH
    ? 'Inti organisasi yang mengawasi sirkulasi kas, arsip dokumen, notulensi rapat, dan arah strategis seluruh program kerja.'
    : `Divisi kerja fungsional HMPS TRPL Polmed pada kepengurusan Periode ${startYear}/${endYear}.`;

  return (
    <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-16">
        <VStack gap={6} align="stretch">

          {/* Back Button */}
          <div>
            <Button
              variant="secondary"
              size="sm"
              label={`← Kembali ke Struktur ${startYear}/${endYear}`}
              href={`/organisasi/${periode}`}
            />
          </div>

          {/* Division Header Banner */}
          <VStack gap={2} align="center">
            <Badge variant="blue" label={`Periode ${startYear}/${endYear}`} />
            <Heading level={1} type="display-1" justify='center' className="text-primary font-sans leading-tight mt-1">
              Divisi {divisionName} HMPS Teknologi Rekayasa Perangkat Lunak {startYear}/{endYear}
            </Heading>
          </VStack>

          {/* Members Roster List */}
          <VStack gap={6} align="stretch" className="mt-4">
            <Heading level={2} className="text-primary font-sans">
              Daftar Anggota Tim ({members.length})
            </Heading>
            <Divider />

            {members.length > 0 ? (
              <div className={members.length === 1 ? "flex justify-center w-full max-w-sm mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"}>
                {members.map((member) => {
                  const isLeader = isLeaderPosition(member.position?.name);
                  return (
                    <Card
                      key={member.uuid}
                      variant="default"
                      padding={5}
                      className={`group relative flex flex-col justify-between items-center text-center h-full rounded-2xl border border-border/80 bg-surface/95 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 overflow-hidden ${
                        isLeader ? 'border-t-4 border-t-accent' : ''
                      }`}
                    >
                      <VStack gap={3} align="center" className="w-full">
                        <div className="relative mx-auto flex items-center justify-center pt-1">
                          <div className="rounded-full p-1 ring-2 ring-border/80 group-hover:ring-accent/60 transition-all duration-300 shadow-md">
                            <Avatar name={member.name} size={isLeader ? 144 : 128} src={resolvePhoto(member.photo)} />
                          </div>
                        </div>

                        <VStack gap={1.5} align="center" className="w-full">
                          <Text type="body" weight="bold" className="text-primary font-sans text-base leading-snug group-hover:text-accent transition-colors duration-200">
                            {member.name}
                          </Text>
                          <Badge
                            variant={isLeader ? 'blue' : 'neutral'}
                            label={member.position?.name || 'Anggota'}
                          />
                        </VStack>

                        {member.bio && (
                          <Text type="supporting" color="secondary" className="font-sans text-xs md:text-sm italic leading-relaxed text-center max-w-xs line-clamp-3 mt-1 px-1">
                            &ldquo;{member.bio}&rdquo;
                          </Text>
                        )}
                      </VStack>

                      {/* Contacts info if provided */}
                      {(member.email || member.phone) && (
                        <div className="mt-4 pt-3 border-t border-border/60 w-full">
                          <HStack gap={3} justify="center" wrap="wrap">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="text-xs text-accent hover:text-primary transition-colors font-sans decoration-none flex items-center gap-1"
                              >
                                <span>📧</span> <span>{member.email}</span>
                              </a>
                            )}
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="text-xs text-accent hover:text-primary transition-colors font-sans decoration-none flex items-center gap-1"
                              >
                                <span>📞</span> <span>{member.phone}</span>
                              </a>
                            )}
                          </HStack>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
                <VStack gap={2} align="center">
                  <Text type="body" weight="bold" className="text-primary font-sans">
                    Divisi tidak ditemukan.
                  </Text>
                  <Text type="body" color="secondary" className="font-sans">
                    Divisi &ldquo;{divisionName}&rdquo; tidak terdaftar pada periode {startYear}/{endYear}, atau belum memiliki anggota.
                  </Text>
                </VStack>
              </div>
            )}
          </VStack>

        </VStack>
      </main>

      <Footer />
    </div>
  );
}
