import type { Metadata } from "next";

import { AboutPageContent } from "@/features/public-content/components/about-page";
import { safeExternalUrl } from "@/features/public-content/components/public-content-utils";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "پرتفولیوی دانشگاهی";
  const title = profile?.fullName ? `درباره ${profile.fullName}` : "درباره پروفایل دانشگاهی";

  return createPublicMetadata({
    title,
    description:
      profile?.shortBio ??
      settings?.siteDescription ??
      "زندگی‌نامه، پیشینه دانشگاهی، علایق و تجربه‌های علمی.",
    path: "/about",
    siteName,
    imageUrl: safeExternalUrl(profile?.profileImageUrl ?? settings?.defaultOgImageUrl),
    imageAlt: profile?.fullName ? `پروفایل ${profile.fullName}` : title,
  });
}

export default async function AboutPage() {
  const content = await getPublicPortfolioContent();
  return <AboutPageContent {...content} />;
}
