import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    HStack,
    VStack,
    Heading,
    Text,
    Badge,
    Button,
    Avatar,
    Divider,
    Card
} from '@astryxdesign/core';
import { apiFetch, mockPosts, parsePostBody, sanitizeHtml, getPostThumbnail, type Post } from '../utils/api';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch the article details
    const fallbackPost = mockPosts.find((p: Post) => p.slug === slug) || mockPosts[0];
    const post = await apiFetch<Post>(`/posts/${slug}`, fallbackPost);
    // Fetch related/other posts
    const allPosts = await apiFetch<Post[]>('/posts', mockPosts);
    const postsArray = Array.isArray(allPosts) ? allPosts : ((allPosts as any)?.data || []);
    // Filter out current post and take 3 items
    const otherPosts = postsArray.filter((p: Post) => p.slug !== slug).slice(0, 3);

    // Section-based body (JSON [{content, file[]}]); null means legacy plain-text body
    const sections = parsePostBody(post.body);

    // Cover image: featured_img or the first image of the first section with one.
    // When it comes from a section, remove it there so it only renders at the top.
    const thumbnail = getPostThumbnail(post);
    let displaySections = sections;
    if (sections && thumbnail && !post.featured_img) {
        let removed = false;
        displaySections = sections.map(s => {
            if (!removed && s.file[0] === thumbnail) {
                removed = true;
                return { ...s, file: s.file.slice(1) };
            }
            return s;
        });
    }

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
                            label="&larr; Kembali ke Blog"
                            href="/blog"
                        />
                    </div>

                    {/* Article Header info */}
                    <VStack gap={4} className="border-b border-border pb-6">
                        <HStack justify="between" align="center">
                            <Badge variant="blue" label={post.category?.name || 'Berita'} />
                            <Text type="supporting" color="secondary" className="text-xs font-sans">
                                Dilihat {post.views || 0} kali
                            </Text>
                        </HStack>

                        <Heading level={1} type="display-2" className="text-primary font-sans leading-tight tracking-tight">
                            {post.title}
                        </Heading>

                        {/* Author & Date metadata */}
                        <HStack gap={3} align="center">
                            <Avatar name={post.user?.name || 'Admin'} size="xsmall" />
                            <VStack gap={0.5}>
                                <Text type="body" weight="semibold" className="text-primary font-sans text-sm leading-none">
                                    {post.user?.name || 'Admin'}
                                </Text>
                                <Text type="supporting" color="secondary" className="text-xs font-sans">
                                    Diterbitkan pada {new Date(post.published_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </VStack>
                        </HStack>
                    </VStack>

                    {/* Article Cover Image (featured_img or first image of first section) */}
                    {thumbnail && (
                        <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden border border-border relative bg-muted/20">
                            <img
                                src={thumbnail}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Content Body */}
                    <article className="prose dark:prose-invert max-w-none py-4 font-sans text-primary leading-relaxed text-base">
                        {displaySections ? (
                            /* Section-based rendering: sanitized HTML content + image gallery per section */
                            displaySections.map((section, sectionIdx) => (
                                <div key={sectionIdx} className="mb-10">
                                    {section.content && (
                                        <div
                                            className="text-secondary font-sans leading-relaxed text-justify [&_p]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_strong]:text-primary"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                                        />
                                    )}
                                    {section.file.length > 0 && (
                                        <div className={`grid gap-4 mt-6 ${section.file.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                            {section.file.map((fileUrl, fileIdx) => (
                                                <div key={fileIdx} className="w-full rounded-2xl overflow-hidden border border-border bg-muted/20">
                                                    <img
                                                        src={fileUrl}
                                                        alt={`Gambar ${fileIdx + 1} — section ${sectionIdx + 1}`}
                                                        className="w-full h-auto max-h-[70vh] object-contain"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                        /* Legacy body: split by newlines and render paragraphs/subheaders */
                        post.body.split('\n\n').map((paragraph: string, index: number) => {
                            if (paragraph.startsWith('### ')) {
                                return (
                                    <Heading key={index} level={3} className="text-primary font-sans mt-8 mb-4">
                                        {paragraph.replace('### ', '')}
                                    </Heading>
                                );
                            }
                            if (paragraph.startsWith('## ')) {
                                return (
                                    <Heading key={index} level={2} className="text-primary font-sans mt-8 mb-4">
                                        {paragraph.replace('## ', '')}
                                    </Heading>
                                );
                            }
                            if (paragraph.startsWith('- ')) {
                                return (
                                    <ul key={index} className="list-disc pl-6 mb-4 space-y-1">
                                        {paragraph.split('\n').map((item: string, itemIdx: number) => (
                                            <li key={itemIdx} className="text-secondary font-sans">
                                                {item.replace('- ', '')}
                                            </li>
                                        ))}
                                    </ul>
                                );
                            }
                            if (paragraph.startsWith('1. ')) {
                                return (
                                    <ol key={index} className="list-decimal pl-6 mb-4 space-y-1">
                                        {paragraph.split('\n').map((item: string, itemIdx: number) => (
                                            <li key={itemIdx} className="text-secondary font-sans">
                                                {item.replace(/^\d+\.\s+/, '')}
                                            </li>
                                        ))}
                                    </ol>
                                );
                            }
                            return (
                                <p key={index} className="text-secondary font-sans mb-4 text-justify">
                                    {paragraph}
                                </p>
                            );
                        })
                        )}
                    </article>

                    {/* Tags footer */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="pt-6 border-t border-border mt-8">
                            <HStack gap={2} align="center" wrap="wrap">
                                <Text type="supporting" color="secondary" className="font-sans mr-2">Tags:</Text>
                                {post.tags.map((tag: any) => (
                                    <Badge key={tag.id} variant="neutral" label={`#${tag.name}`} />
                                ))}
                            </HStack>
                        </div>
                    )}

                    {/* Berita Lainnya Section */}
                    {otherPosts.length > 0 && (
                        <div className="pt-10 border-t border-border mt-10">
                            <VStack gap={6} align="stretch">
                                <Heading level={2} className="text-primary font-sans text-xl font-bold">
                                    Berita & Artikel Lainnya
                                </Heading>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {otherPosts.map((other: Post) => (
                                        <Card key={other.id} variant="muted" padding={4} className="flex flex-col justify-between h-full">
                                            <VStack gap={3} align="start">
                                                <HStack justify="between" align="center" className="w-full">
                                                    <Badge variant="blue" label={other.category?.name || 'Berita'} />
                                                    <Text type="supporting" color="secondary" className="text-xs">
                                                        {new Date(other.published_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </Text>
                                                </HStack>
                                                <Heading level={3} className="text-primary font-sans text-sm font-bold mt-1 line-clamp-2">
                                                    {other.title}
                                                </Heading>
                                                <Text type="body" color="secondary" className="font-sans text-xs leading-relaxed line-clamp-2 text-justify">
                                                    {other.excerpt}
                                                </Text>
                                            </VStack>
                                            <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center w-full">
                                                <span className="text-[10px] text-disabled">Oleh: {other.user?.name || 'Admin'}</span>
                                                <Link 
                                                    href={`/blog/${other.slug}`} 
                                                    className="text-xs font-semibold text-accent hover:text-primary transition-colors decoration-none font-sans"
                                                >
                                                    Baca &rarr;
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </VStack>
                        </div>
                    )}

                </VStack>
            </main>

            <Footer />
        </div>
    );
}
