import type { Metadata } from "next";

import { ContactPageContent } from "@/features/public-content/components/contact-page";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPublicPortfolioContent();

  return {
    title: "Contact",
    description:
      profile?.shortBio ?? settings?.siteDescription ?? "Contact details and academic links.",
  };
}

export default async function ContactPage() {
  const content = await getPublicPortfolioContent();
  return <ContactPageContent {...content} />;
}
