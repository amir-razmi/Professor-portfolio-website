import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/header";
import { siteConfig } from "@/config/site";
import { getCachedPublicSiteSettings } from "@/features/public-content/server/public-content-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedPublicSiteSettings();
  const siteName = settings?.siteName ?? siteConfig.name;

  return {
    ...createPublicMetadata({
      title: siteName,
      description: settings?.siteDescription ?? siteConfig.description,
      path: "/",
      siteName,
    }),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getCachedPublicSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader siteName={settings?.siteName ?? siteConfig.name} />
      {settings?.maintenanceMode ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">
          This site is currently being updated. Some information may change while maintenance is in
          progress.
        </div>
      ) : null}
      <main className="flex-1">{children}</main>
      <SiteFooter
        contactEmail={settings?.contactEmail}
        siteName={settings?.siteName ?? siteConfig.name}
        footerText={settings?.footerText}
      />
    </div>
  );
}
