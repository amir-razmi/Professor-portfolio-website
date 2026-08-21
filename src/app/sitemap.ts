import type { MetadataRoute } from "next";

import { getPublicBlogSitemapSlugs } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured : "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl().replace(/\/+$/, "");
  const staticPaths = ["/", "/about", "/research", "/publications", "/contact", "/blog", "/files"];
  const slugs = await getPublicBlogSitemapSlugs();

  return [
    ...staticPaths.map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "weekly" as const,
    })),
    ...slugs.map((slug) => ({
      url: `${baseUrl}/blog/${encodeURIComponent(slug)}`,
      changeFrequency: "monthly" as const,
    })),
  ];
}
