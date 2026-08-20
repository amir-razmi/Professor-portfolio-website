import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteNavigation() {
  return (
    <nav aria-label="Primary navigation" className="w-full overflow-x-auto md:w-auto">
      <ul className="flex min-w-max items-center gap-1 md:min-w-0 md:gap-2">
        {siteConfig.navigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
