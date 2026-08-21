import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadataBase =
  configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)
    ? new URL(configuredSiteUrl)
    : new URL("http://localhost:3000");

export function siteUrl(): string {
  return metadataBase.toString().replace(/\/+$/, "");
}

type PublicMetadataOptions = {
  title: string;
  description: string;
  path: string;
  siteName?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
};

export function createPublicMetadata({
  title,
  description,
  path,
  siteName = siteConfig.name,
  imageUrl,
  imageAlt = title,
  type = "website",
}: PublicMetadataOptions): Metadata {
  const images = imageUrl ? [{ url: imageUrl, alt: imageAlt }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type,
      title,
      description,
      siteName,
      url: path,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
