import Link from "next/link";

import { siteConfig } from "@/config/site";

import { SiteNavigation } from "./navigation";
import { Container } from "../ui/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-background/95 backdrop-blur">
      <Container className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-3 rounded-lg text-sm font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-orange-200">
            AP
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <SiteNavigation />
      </Container>
    </header>
  );
}
