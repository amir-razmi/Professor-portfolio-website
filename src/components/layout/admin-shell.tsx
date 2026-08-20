import type { ReactNode } from "react";
import Link from "next/link";

import { Container } from "../ui/container";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <Container className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Administration
            </p>
            <p className="mt-1 text-sm font-medium text-slate-950">Academic portfolio workspace</p>
          </div>
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Return to site
          </Link>
        </Container>
      </header>
      <main>{children}</main>
    </div>
  );
}
