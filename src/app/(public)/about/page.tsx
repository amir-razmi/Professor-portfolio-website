import type { Metadata } from "next";

import { AboutPageContent } from "@/features/public-content/components/about-page";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();

  return {
    title: "About",
    description:
      profile?.shortBio ??
      settings?.siteDescription ??
      "Biography, academic background, interests, and experience.",
  };
}

export default async function AboutPage() {
  const content = await getPublicPortfolioContent();
  return <AboutPageContent {...content} />;
}
