import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/research", "/publications", "/blog", "/files", "/contact"],
      disallow: ["/admin/", "/api/", "/login"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
