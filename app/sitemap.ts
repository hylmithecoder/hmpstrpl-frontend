import type { MetadataRoute } from "next";
import {
  mockPosts,
  mockPages,
  mockManagementYears,
} from "./utils/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hmpstrpl.polmed.ac.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/organisasi`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/kontak`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const blogRoutes = mockPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const pageRoutes = Object.values(mockPages).map((page) => ({
    url: `${BASE_URL}/page/${page.slug}`,
    lastModified: new Date(page.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const organisasiRoutes = mockManagementYears.map((year) => ({
    url: `${BASE_URL}/organisasi/${year.slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...pageRoutes, ...organisasiRoutes];
}
