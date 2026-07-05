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

interface PageProps {
  params: Promise<{ periode: string; divisi: string }>;
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

  // Division title: API name, or prettified slug ("ilmu-pengetahun-dan-teknologi" → "Ilmu Pengetahun Dan Teknologi")
  const prettySlug = divisi.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const divisionName = members[0]?.division?.name || prettySlug;

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
            <Heading level={1} type="display-1" className="text-primary font-sans leading-tight mt-1">
              {divisionName}
            </Heading>
            <Text type="body" color="secondary" className="font-sans leading-relaxed text-justify max-w-2xl mt-1">
              {divisionDesc}
            </Text>
          </VStack>

          {/* Members Roster List */}
          <VStack gap={6} align="stretch" className="mt-4">
            <Heading level={2} className="text-primary font-sans">
              Daftar Anggota Tim ({members.length})
            </Heading>
            <Divider />

            {members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {members.map((member) => (
                  <Card key={member.uuid} variant="default" padding={5} className="flex flex-col justify-between">
                    <VStack gap={4} align="start">
                      <VStack gap={3} align="center" className="w-full text-center">
                        <Avatar name={member.name} size={128} src={resolvePhoto(member.photo)} />
                        <VStack gap={1} align="center">
                          <Text type="body" weight="bold" className="text-primary font-sans leading-tight">
                            {member.name}
                          </Text>
                          <Badge
                            variant={member.position?.name.toLowerCase().includes('kepala') || member.position?.name.toLowerCase().includes('ketua') ? 'blue' : 'neutral'}
                            label={member.position?.name || 'Anggota'}
                          />
                        </VStack>
                      </VStack>

                      <VStack gap={2}>
                        {member.nim && (
                          <HStack gap={2}>
                            <Text type="supporting" color="secondary" weight="semibold" className="text-xs uppercase tracking-wider font-sans w-16">NIM:</Text>
                            <Text type="supporting" color="disabled" className="text-xs font-mono">{member.nim}</Text>
                          </HStack>
                        )}
                        {member.bio && (
                          <Text type="body" color="secondary" className="font-sans text-sm italic leading-relaxed text-justify mt-2">
                            "{member.bio}"
                          </Text>
                        )}
                      </VStack>
                    </VStack>

                    {/* Contacts info if provided */}
                    {(member.email || member.phone) && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <HStack gap={4} wrap="wrap">
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-xs text-accent hover:text-primary transition-colors font-sans decoration-none"
                            >
                              📧 {member.email}
                            </a>
                          )}
                          {member.phone && (
                            <a
                              href={`tel:${member.phone}`}
                              className="text-xs text-accent hover:text-primary transition-colors font-sans decoration-none"
                            >
                              📞 {member.phone}
                            </a>
                          )}
                        </HStack>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
                <VStack gap={2} align="center">
                  <Text type="body" weight="bold" className="text-primary font-sans">
                    Divisi tidak ditemukan.
                  </Text>
                  <Text type="body" color="secondary" className="font-sans">
                    Divisi &ldquo;{prettySlug}&rdquo; tidak terdaftar pada periode {startYear}/{endYear}, atau belum memiliki anggota.
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
