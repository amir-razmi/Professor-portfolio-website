import type { Metadata } from "next";

import { PublicationsPageContent } from "@/features/public-content/components/publications-page";
import { getPublicAcademicContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicAcademicContent();
  const siteName = settings?.siteName ?? "پرتفولیوی دانشگاهی";

  return createPublicMetadata({
    title: "انتشارات",
    description: profile?.fullName
      ? `آثار علمی منتشرشده ${profile.fullName}.`
      : (settings?.siteDescription ?? "آثار علمی منتشرشده."),
    path: "/publications",
    siteName,
  });
}

export default async function PublicationsPage() {
  const { profile, publications } = await getPublicAcademicContent();
  return <PublicationsPageContent profile={profile} publications={publications} />;
}
