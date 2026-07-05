import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  VStack,
  Heading,
  Text,
  Badge,
  Button
} from '@astryxdesign/core';
import { apiFetch, mockPages, type PageData } from '../../utils/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StaticPageDetail({ params }: PageProps) {
  const { slug } = await params;

  // Fetch the page details
  const fallbackPage = mockPages[slug] || mockPages['visi-misi'];
  const page = await apiFetch<PageData>(`/pages/${slug}`, fallbackPage);

  return (
    <div className="flex flex-col min-h-screen bg-body text-primary transition-colors duration-250">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16">
        <VStack gap={6} align="stretch">
          
          {/* Header */}
          <VStack gap={4} className="border-b border-border pb-6">
            <Badge variant="blue" label="Profil Organisasi" />
            <Heading level={1} type="display-2" className="text-primary font-sans leading-tight tracking-tight">
              {page.title}
            </Heading>
            <Text type="supporting" color="secondary" className="text-xs font-sans">
              Terakhir diperbarui &bull; Dilihat {page.views || 0} kali
            </Text>
          </VStack>

          {/* Page Image if available */}
          {page.featured_img && (
            <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border relative bg-muted/20">
              <img
                src={page.featured_img}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Page content parsing */}
          <article className="prose dark:prose-invert max-w-none py-4 font-sans text-primary leading-relaxed text-base">
            {page.body.split('\n\n').map((paragraph, index) => {
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
                    {paragraph.split('\n').map((item, itemIdx) => (
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
                    {paragraph.split('\n').map((item, itemIdx) => (
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
            })}
          </article>

        </VStack>
      </main>

      <Footer />
    </div>
  );
}
