'use client';

import { VStack, Heading, Text, Card, Badge, Button, Divider, HStack } from '@astryxdesign/core';
import type { Post, ContactMessage, AdminStats } from '../../utils/api';

interface OverviewTabProps {
    stats: AdminStats;
    posts: Post[];
    inbox: ContactMessage[];
    setActiveTab: (tab: any) => void;
}

export default function OverviewTab({ stats, posts, inbox, setActiveTab }: OverviewTabProps) {
    return (
        <VStack gap={6} align="stretch">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="default" padding={4} className="text-center">
                    <VStack gap={1}>
                        <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Artikel</Text>
                        <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalPosts}</Heading>
                    </VStack>
                </Card>
                <Card variant="default" padding={4} className="text-center">
                    <VStack gap={1}>
                        <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Anggota</Text>
                        <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalMembers}</Heading>
                    </VStack>
                </Card>
                <Card variant="default" padding={4} className="text-center">
                    <VStack gap={1}>
                        <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Divisi</Text>
                        <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalDivisions}</Heading>
                    </VStack>
                </Card>
                <Card variant="default" padding={4} className="text-center">
                    <VStack gap={1}>
                        <Text type="supporting" color="secondary" className="text-xs uppercase tracking-wider">Pesan</Text>
                        <Heading level={2} className="text-accent font-sans text-3xl font-bold">{stats.totalInbox}</Heading>
                    </VStack>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="default" padding={5}>
                    <VStack gap={4} align="stretch">
                        <HStack justify="between" align="center">
                            <Heading level={3} className="text-primary font-sans">Artikel Terbaru</Heading>
                            <Button variant="ghost" size="sm" label="Semua" onClick={() => setActiveTab('posts')} />
                        </HStack>
                        <Divider />
                        <VStack gap={3} align="stretch">
                            {posts.slice(0, 3).map((p) => (
                                <HStack key={p.id} justify="between" align="center">
                                    <Text type="body" weight="semibold" className="text-primary text-sm truncate max-w-[200px]">
                                        {p.title}
                                    </Text>
                                    <Badge variant="neutral" label={`${p.views} views`} />
                                </HStack>
                            ))}
                        </VStack>
                    </VStack>
                </Card>

                <Card variant="default" padding={5}>
                    <VStack gap={4} align="stretch">
                        <HStack justify="between" align="center">
                            <Heading level={3} className="text-primary font-sans">Pesan Terbaru</Heading>
                            <Button variant="ghost" size="sm" label="Semua" onClick={() => setActiveTab('inbox')} />
                        </HStack>
                        <Divider />
                        <VStack gap={3} align="stretch">
                            {inbox.slice(0, 3).map((msg) => (
                                <VStack key={msg.id} gap={1} align="start" className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                    <Text type="supporting" weight="bold" className="text-primary text-xs leading-none">{msg.name}</Text>
                                    <Text type="supporting" color="secondary" className="text-xs truncate max-w-[220px]">{msg.subject}</Text>
                                </VStack>
                            ))}
                        </VStack>
                    </VStack>
                </Card>
            </div>
        </VStack>
    );
}
