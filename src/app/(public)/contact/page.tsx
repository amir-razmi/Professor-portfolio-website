import type { Metadata } from "next";

import { ContactPageContent } from "@/features/public-content/components/contact-page";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "Academic Portfolio";

  return createPublicMetadata({
    title: "Contact",
    description:
      profile?.shortBio ?? settings?.siteDescription ?? "Contact details and academic links.",
    path: "/contact",
    siteName,
  });
}

export default async function ContactPage() {
  const content = await getPublicPortfolioContent();
  return <ContactPageContent {...content} />;
}
