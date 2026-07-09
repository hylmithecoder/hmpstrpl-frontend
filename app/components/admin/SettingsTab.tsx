'use client';

import React from 'react';
import { VStack, Heading, Text, Card, Button, TextInput, Divider } from '@astryxdesign/core';
import type { Setting } from '../../utils/api';

interface SettingsTabProps {
    settings: Setting[];
    setSettings: React.Dispatch<React.SetStateAction<Setting[]>>;
    setBanner: (status: 'success' | 'error', msg: string) => void;
}

export default function SettingsTab({ settings, setSettings, setBanner }: SettingsTabProps) {
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setBanner('success', 'Pengaturan situs berhasil diperbarui!');
    };

    return (
        <Card variant="default" padding={6}>
            <form onSubmit={handleSave} className="flex flex-col gap-6">
                <Heading level={2} className="text-primary font-sans text-xl">Pengaturan Situs</Heading>
                <VStack gap={4} align="stretch">
                    {settings.map((setting) => (
                        <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <div className="md:col-span-1">
                                <Text type="body" weight="semibold" className="text-primary text-sm font-sans">
                                    {setting.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Text>
                            </div>
                            <div className="md:col-span-2">
                                <TextInput
                                    label={setting.key}
                                    isLabelHidden={true}
                                    value={setting.value}
                                    onChange={(val) => {
                                        setSettings(settings.map(s => s.id === setting.id ? { ...s, value: val } : s));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </VStack>
                <Divider />
                <div className="pt-2">
                    <Button type="submit" variant="primary" size="md" label="Simpan Pengaturan" />
                </div>
            </form>
        </Card>
    );
}
