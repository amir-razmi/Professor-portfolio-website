import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const metadataBase =
  configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)
    ? new URL(configuredSiteUrl)
    : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Academic Portfolio",
    template: "%s | Academic Portfolio",
  },
  description: "A focused foundation for presenting research, teaching, and academic work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
