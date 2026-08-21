import type { Metadata } from "next";
import type { ReactNode } from "react";

import { metadataBase } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "پرتفولیوی دانشگاهی",
    template: "%s | پرتفولیوی دانشگاهی",
  },
  description: "مرجعی برای معرفی پژوهش، آموزش و فعالیت‌های دانشگاهی.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "پرتفولیوی دانشگاهی",
    title: "پرتفولیوی دانشگاهی",
    description: "مرجعی برای معرفی پژوهش، آموزش و فعالیت‌های دانشگاهی.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "پرتفولیوی دانشگاهی",
    description: "مرجعی برای معرفی پژوهش، آموزش و فعالیت‌های دانشگاهی.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
