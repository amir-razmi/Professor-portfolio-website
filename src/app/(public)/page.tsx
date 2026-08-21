import type { Metadata } from "next";

import { createPublicMetadata } from "@/lib/seo";
import { safeExternalUrl } from "@/features/public-content/components/public-content-utils";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import HomeFeaturePage from "@/features/home/components/home-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "پرتفولیوی دانشگاهی";
  const title = profile?.fullName ?? siteName;
  const description =
    profile?.shortBio ??
    settings?.siteDescription ??
    "پژوهش، آموزش و فعالیت‌های دانشگاهی در یک پرتفولیوی روشن و منسجم.";

  return createPublicMetadata({
    title,
    description,
    path: "/",
    siteName,
    imageUrl: safeExternalUrl(profile?.profileImageUrl ?? settings?.defaultOgImageUrl),
    imageAlt: profile?.fullName ? `پروفایل ${profile.fullName}` : title,
  });
}

export default HomeFeaturePage;
