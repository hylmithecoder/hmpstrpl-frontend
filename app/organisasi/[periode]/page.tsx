import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { apiFetch, type ManagementYear } from '../../utils/api';
import StrukturOrganisasi from './StrukturOrganisasi';

import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ periode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { periode } = await params;
    return {
        title: `Struktur Organisasi HMPS TRPL Periode ${periode} - Polmed`,
        description: `Struktur kepengurusan dan keanggotaan Himpunan Mahasiswa Program Studi Teknologi Rekayasa Perangkat Lunak Politeknik Negeri Medan Periode ${periode}.`,
        keywords: [`Organisasi TRPL`, `Pengurus TRPL ${periode}`, `HMPS TRPL Polmed`, `Politeknik Negeri Medan`],
    };
}

export default async function OrganisasiPeriodePage({ params }: PageProps) {
    const { periode } = await params;

    // Fetch fresh data on every request. No mock fallback: an unknown period (404)
    // yields an empty structure and renders the "tidak ditemukan" state.
    const [slugStart, slugEnd] = periode.split('-').map(Number);
    const emptyStructure: ManagementYear = {
        id: 0,
        start_year: slugStart || 0,
        end_year: slugEnd || 0,
        slug: periode,
        divisions: []
    };
    const [years, structure] = await Promise.all([
        apiFetch<ManagementYear[]>('/management-years', [], { noStore: true }),
        apiFetch<ManagementYear>(`/struktur-organisasi/${periode}`, emptyStructure, { noStore: true }),
    ]);

    return (
        <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
            <Navbar />
            <StrukturOrganisasi periode={periode} years={years} structure={structure} />
            <Footer />
        </div>
    );
}
