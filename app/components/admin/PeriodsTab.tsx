'use client';

import React, { useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, HStack } from '@astryxdesign/core';
import { apiAdminMutate, type ManagementYear } from '../../utils/api';

interface PeriodsTabProps {
    years: ManagementYear[];
    setYears: React.Dispatch<React.SetStateAction<ManagementYear[]>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function PeriodsTab({ years, setYears, setBanner }: PeriodsTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [whatsappLink, setWhatsappLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const start = parseInt(yearStart);
        const end = parseInt(yearEnd);
        if (isNaN(start) || isNaN(end) || end <= start) {
            setBanner('error', 'Format tahun tidak valid atau tahun selesai harus lebih besar.');
            return;
        }

        const newYear: ManagementYear = {
            id: years.length + 1,
            start_year: start,
            end_year: end,
            slug: `${start}-${end}`,
            ...(whatsappLink.trim() ? { whatsapp_group_link: whatsappLink.trim() } : {})
        };

        const response = await apiAdminMutate<ManagementYear>("/admin/management-years", "POST", newYear);
        if (!response.success) {
            setBanner('error', response.message);
            return;
        }

        const savedYear = response.data || newYear;
        setYears([savedYear, ...years]);
        setYearStart('');
        setYearEnd('');
        setWhatsappLink('');
        setShowForm(false);
        setBanner('success', 'Periode kepengurusan baru berhasil ditambahkan!');
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Periode Kepengurusan</Heading>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    size="md"
                    label={showForm ? 'Batal' : 'Tambah Periode'}
                    onClick={() => setShowForm(!showForm)}
                />
            </HStack>

            {showForm && (
                <Card variant="muted" padding={5}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Tahun Mulai"
                                value={yearStart}
                                onChange={setYearStart}
                                isRequired={true}
                                placeholder="2024"
                            />
                            <TextInput
                                label="Tahun Selesai"
                                value={yearEnd}
                                onChange={setYearEnd}
                                isRequired={true}
                                placeholder="2025"
                            />
                        </div>
                        <TextInput
                            label="Link Grup WhatsApp (Opsional)"
                            value={whatsappLink}
                            onChange={setWhatsappLink}
                            isRequired={false}
                            placeholder="https://chat.whatsapp.com/..."
                        />
                        <Button type="submit" variant="primary" size="md" label="Simpan Periode" />
                    </form>
                </Card>
            )}

            <div className="border border-border rounded-xl bg-surface p-4">
                <VStack gap={3} align="stretch">
                    {years.map(y => (
                        <HStack key={y.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <VStack gap={1}>
                                <Text type="body" weight="semibold" className="text-primary text-sm">
                                    Tahun Kepengurusan {y.start_year}/{y.end_year}
                                </Text>
                                {y.whatsapp_group_link && (
                                    <Text type="supporting" color="secondary" className="text-xs truncate max-w-xs md:max-w-md">
                                        WA: {y.whatsapp_group_link}
                                    </Text>
                                )}
                            </VStack>
                            <Button
                                variant="ghost"
                                size="sm"
                                label="Hapus"
                                onClick={async () => {
                                    const res = await apiAdminMutate(`/admin/management-years/${y.id}`, 'DELETE');
                                    if (res.success) {
                                        setYears(years.filter(item => item.id !== y.id));
                                        setBanner('success', 'Periode kepengurusan berhasil dihapus.');
                                    } else {
                                        setBanner('error', res.message || 'Gagal menghapus periode kepengurusan.');
                                    }
                                }}
                            />
                        </HStack>
                    ))}
                </VStack>
            </div>
        </VStack>
    );
}
