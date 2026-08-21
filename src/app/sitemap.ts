import type { MetadataRoute } from "next";

import { getPublicBlogSitemapSlugs } from "@/features/blog/server/blog-service";
import { siteUrl } from "@/lib/seo";

// Blog publication changes explicitly revalidate this route. Keep the sitemap
// request-time rendered so unpublished content is never served from a stale build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const staticPaths = ["/", "/about", "/research", "/publications", "/contact", "/blog", "/files"];
  const slugs = await getPublicBlogSitemapSlugs();

  return [
    ...staticPaths.map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...slugs.map((slug) => ({
      url: `${baseUrl}/blog/${encodeURIComponent(slug)}`,
      changeFrequency: "monthly" as const,
    })),
  ];
}
