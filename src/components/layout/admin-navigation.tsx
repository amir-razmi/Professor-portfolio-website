"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavigationItem = {
  href: string;
  label: string;
};

export function AdminNavigation({
  items,
  onNavigate,
}: Readonly<{
  items: readonly AdminNavigationItem[];
  onNavigate?: () => void;
}>) {
  const pathname = usePathname();

  return (
    <nav aria-label="ناوبری مدیریت">
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                className={[
                  "flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isActive
                    ? "bg-orange-100 text-orange-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
