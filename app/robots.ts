import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/login/"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://hmpstrpl.polmed.ac.id"}/sitemap.xml`,
  };
}
