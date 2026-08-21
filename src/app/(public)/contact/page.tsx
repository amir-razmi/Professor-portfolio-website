import type { Metadata } from "next";

import { ContactPageContent } from "@/features/public-content/components/contact-page";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "پرتفولیوی دانشگاهی";

  return createPublicMetadata({
    title: "تماس",
    description: profile?.shortBio ?? settings?.siteDescription ?? "اطلاعات تماس و پیوندهای علمی.",
    path: "/contact",
    siteName,
  });
}

export default async function ContactPage() {
  const content = await getPublicPortfolioContent();
  return <ContactPageContent {...content} />;
}
