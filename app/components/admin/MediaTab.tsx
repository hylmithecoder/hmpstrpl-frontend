'use client';

import React, { useState } from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, HStack } from '@astryxdesign/core';
import { API_ORIGIN, resolveMediaUrl, type Media } from '../../utils/api';

interface MediaTabProps {
    media: Media[];
    setMedia: React.Dispatch<React.SetStateAction<Media[]>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'];

function isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return IMAGE_EXTS.includes(ext);
}

function getMediaUrl(file: Media): string {
    if (file.url?.startsWith('http') || file.url?.startsWith('data:') || file.url?.startsWith('blob:')) return file.url;
    if (file.url) return `${API_ORIGIN}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
    return resolveMediaUrl(file.filename);
}

export default function MediaTab({ media, setMedia, setBanner }: MediaTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [mediaName, setMediaName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaName) {
            setBanner('error', 'Nama berkas media wajib diisi.');
            return;
        }
        const newFile: Media = {
            id: media.length + 1,
            filename: mediaName.includes('.') ? mediaName : `${mediaName}.png`,
            url: `/images/${mediaName}`,
            size: Math.floor(Math.random() * 300000) + 15000,
            created_at: new Date().toISOString()
        };
        setMedia([newFile, ...media]);
        setMediaName('');
        setShowForm(false);
        setBanner('success', 'Berkas media berhasil diunggah!');
    };

    return (
        <VStack gap={6} align="stretch">
            <HStack justify="between" align="center">
                <Heading level={2} className="text-primary font-sans text-xl">Media Library</Heading>
            </HStack>

            {showForm && (
                <Card variant="muted" padding={5}>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <TextInput
                            label="Nama Berkas"
                            value={mediaName}
                            onChange={setMediaName}
                            isRequired={true}
                            placeholder="nama_banner.png"
                        />
                        <Button type="submit" variant="primary" size="md" label="Simpan Berkas" />
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map(file => (
                    <div key={file.id} className="group relative border border-border rounded-xl overflow-hidden bg-surface hover:border-accent transition-colors">
                        {/* Thumbnail */}
                        <div className="aspect-square w-full bg-muted/20 flex items-center justify-center overflow-hidden">
                            {isImage(file.filename) ? (
                                <img
                                    src={getMediaUrl(file)}
                                    alt={file.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`${isImage(file.filename) ? 'hidden' : ''} text-4xl text-disabled`}>📄</div>
                        </div>

                        {/* Info */}
                        <div className="p-2">
                            <Text type="body" weight="bold" className="text-primary text-xs truncate block">{file.filename}</Text>
                            <Text type="supporting" color="disabled" className="text-[10px]">
                                {Math.round(file.size / 1024)} KB
                            </Text>
                        </div>
                    </div>
                ))}
            </div>
        </VStack>
    );
}
