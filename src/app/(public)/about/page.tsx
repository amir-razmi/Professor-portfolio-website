import type { Metadata } from "next";

import { AboutPageContent } from "@/features/public-content/components/about-page";
import { safeExternalUrl } from "@/features/public-content/components/public-content-utils";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "Academic Portfolio";
  const title = profile?.fullName ? `About ${profile.fullName}` : "About the academic profile";

  return createPublicMetadata({
    title,
    description:
      profile?.shortBio ??
      settings?.siteDescription ??
      "Biography, academic background, interests, and experience.",
    path: "/about",
    siteName,
    imageUrl: safeExternalUrl(profile?.profileImageUrl ?? settings?.defaultOgImageUrl),
    imageAlt: profile?.fullName ? `${profile.fullName} profile` : title,
  });
}

export default async function AboutPage() {
  const content = await getPublicPortfolioContent();
  return <AboutPageContent {...content} />;
}
