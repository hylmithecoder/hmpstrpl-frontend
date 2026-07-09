'use client';

import React, { useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, Badge, HStack } from '@astryxdesign/core';
import type { Category, Tag } from '../../utils/api';

interface CategoriesTabProps {
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function CategoriesTab({ categories, setCategories, tags, setTags, setBanner }: CategoriesTabProps) {
    const [showCatForm, setShowCatForm] = useState(false);
    const [catName, setCatName] = useState('');
    const [catDesc, setCatDesc] = useState('');

    const [showTagForm, setShowTagForm] = useState(false);
    const [tagName, setTagName] = useState('');

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName) {
            setBanner('error', 'Nama Kategori wajib diisi.');
            return;
        }
        const newCat: Category = {
            id: categories.length + 1,
            name: catName,
            description: catDesc
        };
        setCategories([...categories, newCat]);
        setCatName('');
        setCatDesc('');
        setShowCatForm(false);
        setBanner('success', 'Kategori baru berhasil dibuat!');
    };

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagName) {
            setBanner('error', 'Nama Tag wajib diisi.');
            return;
        }
        const newTag: Tag = {
            id: tags.length + 1,
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            posts_count: 0
        };
        setTags([...tags, newTag]);
        setTagName('');
        setShowTagForm(false);
        setBanner('success', 'Tag baru berhasil dibuat!');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Categories Column */}
            <VStack gap={4} align="stretch">
                <HStack justify="between" align="center">
                    <Heading level={2} className="text-primary font-sans text-lg">Kategori</Heading>
                    <Button
                        variant="primary"
                        size="sm"
                        label={showCatForm ? 'Batal' : 'Tambah'}
                        onClick={() => setShowCatForm(!showCatForm)}
                    />
                </HStack>

                {showCatForm && (
                    <Card variant="muted" padding={4}>
                        <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                            <TextInput
                                label="Nama Kategori"
                                value={catName}
                                onChange={setCatName}
                                isRequired={true}
                            />
                            <TextInput
                                label="Deskripsi (Opsional)"
                                value={catDesc}
                                onChange={setCatDesc}
                            />
                            <Button type="submit" variant="primary" size="sm" label="Simpan Kategori" />
                        </form>
                    </Card>
                )}

                <div className="border border-border rounded-xl bg-surface p-4">
                    <VStack gap={3} align="stretch">
                        {categories.map(c => (
                            <HStack key={c.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <VStack gap={0.5}>
                                    <Text type="body" weight="bold" className="text-primary text-sm">{c.name}</Text>
                                    {c.description && <Text type="supporting" color="secondary" className="text-xs">{c.description}</Text>}
                                </VStack>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    label="Hapus"
                                    onClick={() => setCategories(categories.filter(item => item.id !== c.id))}
                                />
                            </HStack>
                        ))}
                    </VStack>
                </div>
            </VStack>

            {/* Tags Column */}
            <VStack gap={4} align="stretch">
                <HStack justify="between" align="center">
                    <Heading level={2} className="text-primary font-sans text-lg">Tags</Heading>
                    <Button
                        variant="primary"
                        size="sm"
                        label={showTagForm ? 'Batal' : 'Tambah'}
                        onClick={() => setShowTagForm(!showTagForm)}
                    />
                </HStack>

                {showTagForm && (
                    <Card variant="muted" padding={4}>
                        <form onSubmit={handleCreateTag} className="flex flex-col gap-4">
                            <TextInput
                                label="Nama Tag"
                                value={tagName}
                                onChange={setTagName}
                                isRequired={true}
                            />
                            <Button type="submit" variant="primary" size="sm" label="Simpan Tag" />
                        </form>
                    </Card>
                )}

                <div className="border border-border rounded-xl bg-surface p-4">
                    <VStack gap={3} align="stretch">
                        {tags.map(t => (
                            <HStack key={t.id} justify="between" align="center" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <Badge variant="neutral" label={`#${t.name}`} />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    label="Hapus"
                                    onClick={() => setTags(tags.filter(item => item.id !== t.id))}
                                />
                            </HStack>
                        ))}
                    </VStack>
                </div>
            </VStack>
        </div>
    );
}
