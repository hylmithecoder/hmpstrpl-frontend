'use client';

import { VStack, Heading, Text, Card, Button, HStack } from '@astryxdesign/core';
import type { ContactMessage } from '../../utils/api';

interface InboxTabProps {
    inbox: ContactMessage[];
    setInbox: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
    setStats: React.Dispatch<React.SetStateAction<any>>;
}

export default function InboxTab({ inbox, setInbox, setStats }: InboxTabProps) {
    return (
        <VStack gap={6} align="stretch">
            <Heading level={2} className="text-primary font-sans text-xl">Kotak Masuk Pesan</Heading>
            <VStack gap={4} align="stretch">
                {inbox.length > 0 ? (
                    inbox.map((msg) => (
                        <Card key={msg.id} variant="default" padding={5}>
                            <VStack gap={3} align="stretch">
                                <HStack justify="between" align="center" wrap="wrap" gap={2} className="border-b border-border/50 pb-2">
                                    <VStack gap={0.5}>
                                        <Text type="body" weight="bold" className="text-primary font-sans leading-none">{msg.name}</Text>
                                        <Text type="supporting" color="secondary" className="text-xs font-sans">{msg.email} &bull; {msg.phone || 'No phone'}</Text>
                                    </VStack>
                                    <Text type="supporting" color="disabled" className="text-xs">
                                        {new Date(msg.created_at).toLocaleDateString('id-ID')}
                                    </Text>
                                </HStack>
                                <VStack gap={1}>
                                    <Text type="body" weight="semibold" className="text-primary text-sm font-sans">{msg.subject}</Text>
                                    <Text type="body" color="secondary" className="font-sans leading-relaxed text-sm text-justify">
                                        {msg.message}
                                    </Text>
                                </VStack>
                                <div className="pt-2 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        label="Hapus"
                                        onClick={() => {
                                            setInbox(inbox.filter(item => item.id !== msg.id));
                                            setStats((prev: any) => ({ ...prev, totalInbox: prev.totalInbox - 1 }));
                                        }}
                                    />
                                </div>
                            </VStack>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-surface border border-dashed border-border rounded-xl">
                        <Text type="body" color="secondary" className="font-sans">Tidak ada pesan masuk.</Text>
                    </div>
                )}
            </VStack>
        </VStack>
    );
}
