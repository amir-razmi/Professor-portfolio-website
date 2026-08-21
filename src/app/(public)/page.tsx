import type { Metadata } from "next";

import { createPublicMetadata } from "@/lib/seo";
import { safeExternalUrl } from "@/features/public-content/components/public-content-utils";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import HomeFeaturePage from "@/features/home/components/home-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "Academic Portfolio";
  const title = profile?.fullName ?? siteName;
  const description =
    profile?.shortBio ??
    settings?.siteDescription ??
    "Research, teaching, and academic work presented in one clear public portfolio.";

  return createPublicMetadata({
    title,
    description,
    path: "/",
    siteName,
    imageUrl: safeExternalUrl(profile?.profileImageUrl ?? settings?.defaultOgImageUrl),
    imageAlt: profile?.fullName ? `${profile.fullName} profile` : title,
  });
}

export default HomeFeaturePage;
