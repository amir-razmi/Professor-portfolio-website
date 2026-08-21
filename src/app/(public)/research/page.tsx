import type { Metadata } from "next";

import { ResearchPageContent } from "@/features/public-content/components/research-page";
import { getPublicAcademicContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicAcademicContent();
  const siteName = settings?.siteName ?? "Academic Portfolio";

  return createPublicMetadata({
    title: "Research",
    description:
      profile?.shortBio ?? settings?.siteDescription ?? "Public research interests and projects.",
    path: "/research",
    siteName,
  });
}

export default async function ResearchPage() {
  const { profile, researchItems } = await getPublicAcademicContent();
  return <ResearchPageContent profile={profile} researchItems={researchItems} />;
}
