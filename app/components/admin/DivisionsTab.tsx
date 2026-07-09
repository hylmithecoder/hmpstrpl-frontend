'use client';

import React, { useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, HStack } from '@astryxdesign/core';
import { FiTrash } from 'react-icons/fi';
import { apiAdminMutate, type Division } from '../../utils/api';

interface DivisionsTabProps {
    divisions: Division[];
    setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
    setStats: React.Dispatch<React.SetStateAction<any>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function DivisionsTab({ divisions, setDivisions, setStats, setBanner }: DivisionsTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [alias, setAlias] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !alias) {
            setBanner('error', 'Nama dan Alias Divisi wajib diisi.');
            return;
        }

        const result = await apiAdminMutate<Division>('/admin/divisions', 'POST', {
            name,
            alias: alias.toLowerCase()
        });

        if (result.success) {
            const createdDiv = result.data || {
                id: divisions.length + 1,
                name,
                alias: alias.toLowerCase()
            };
            setDivisions([...divisions, createdDiv]);
            setStats((prev: any) => ({ ...prev, totalDivisions: prev.totalDivisions + 1 }));
            setName('');
            setAlias('');
            setShowForm(false);
            setBanner('success', 'Divisi baru berhasil dibuat!');
        } else {
            setBanner('error', result.message);
        }
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Daftar Divisi</Heading>
                <Button
                    variant={showForm ? 'secondary' : 'primary'}
                    size="md"
                    label={showForm ? 'Batal' : 'Buat Divisi Baru'}
                    onClick={() => setShowForm(!showForm)}
                />
            </HStack>

            {showForm && (
                <Card variant="muted" padding={5}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <TextInput
                            label="Nama Divisi"
                            value={name}
                            onChange={setName}
                            isRequired={true}
                            placeholder="Contoh: Divisi Kreatif & Multimedia"
                        />
                        <TextInput
                            label="Alias / Slug"
                            value={alias}
                            onChange={setAlias}
                            isRequired={true}
                            placeholder="Contoh: media"
                        />
                        <Button type="submit" variant="primary" size="md" label="Simpan Divisi" />
                    </form>
                </Card>
            )}

            <div className="border border-border rounded-xl bg-surface p-4">
                <VStack gap={3} align="stretch">
                    {divisions.map(d => (
                        <HStack key={d.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <VStack gap={0.5}>
                                <Text type="body" weight="bold" className="text-primary text-sm">{d.name}</Text>
                                <Text type="supporting" color="disabled" className="text-xs font-mono">Alias: {d.alias}</Text>
                            </VStack>
                            <Button
                                variant="ghost"
                                size="sm"
                                label=""
                                onClick={async () => {
                                    const res = await apiAdminMutate(`/admin/divisions/${d.id}`, 'DELETE');
                                    if (res.success) {
                                        setDivisions(divisions.filter(item => item.id !== d.id));
                                        setStats((prev: any) => ({ ...prev, totalDivisions: Math.max(0, prev.totalDivisions - 1) }));
                                        setBanner('success', 'Divisi berhasil dihapus.');
                                    } else {
                                        setBanner('error', res.message);
                                    }
                                }}
                            >
                                <FiTrash size={16} color="red" />
                            </Button>
                        </HStack>
                    ))}
                </VStack>
            </div>
        </VStack>
    );
}
