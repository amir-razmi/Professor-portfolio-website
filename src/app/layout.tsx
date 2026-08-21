import type { Metadata } from "next";
import type { ReactNode } from "react";

import { metadataBase } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Academic Portfolio",
    template: "%s | Academic Portfolio",
  },
  description: "A focused foundation for presenting research, teaching, and academic work.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Academic Portfolio",
    title: "Academic Portfolio",
    description: "A focused foundation for presenting research, teaching, and academic work.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Academic Portfolio",
    description: "A focused foundation for presenting research, teaching, and academic work.",
  },
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
