import type { ReactNode } from "react";
import Link from "next/link";

import { Permission, hasPermission, type AuthorizationPrincipal } from "@/server/auth/permissions";
import { logoutAction } from "@/server/auth/actions";

import { AdminNavigation, type AdminNavigationItem } from "./admin-navigation";

const navigationItems: readonly (AdminNavigationItem & {
  permission?: (typeof Permission)[keyof typeof Permission];
})[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  {
    href: "/admin/profile",
    label: "Professor profile",
    permission: Permission.MANAGE_PROFESSOR_PROFILE,
  },
  {
    href: "/admin/settings",
    label: "Site settings",
    permission: Permission.MANAGE_SITE_SETTINGS,
  },
];

function getInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminShell({
  admin,
  children,
}: Readonly<{
  admin: AuthorizationPrincipal & {
    displayName: string;
    email: string;
  };
  children: ReactNode;
}>) {
  const visibleItems = navigationItems.filter(
    (item) => !item.permission || hasPermission(admin, item.permission),
  );
  const initials = getInitials(admin.displayName);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link
            href="/admin/dashboard"
            className="inline-flex rounded-lg text-sm font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="mr-3 flex size-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-orange-200">
              AP
            </span>
            <span className="self-center">Portfolio admin</span>
          </Link>
        </div>
        <div className="flex-1 px-3 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <AdminNavigation items={visibleItems} />
        </div>
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/"
            className="flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View public site
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <details className="relative lg:hidden">
                <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="mr-2 text-base">
                    ☰
                  </span>
                  Menu
                </summary>
                <div className="absolute left-0 top-12 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <AdminNavigation items={visibleItems} />
                  <Link
                    href="/"
                    className="mt-3 block rounded-lg border-t border-slate-200 px-3 pt-3 text-sm font-medium text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    View public site
                  </Link>
                </div>
              </details>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Administration
                </p>
                <p className="hidden text-sm font-medium text-slate-950 sm:block">
                  Academic portfolio workspace
                </p>
              </div>
            </div>

            <details className="relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-orange-200">
                  {initials || "A"}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-slate-950">
                    {admin.displayName}
                  </span>
                  <span className="block text-xs uppercase tracking-wide text-slate-500">
                    {admin.role.replace("_", " ")}
                  </span>
                </span>
                <span className="sr-only">Open account menu</span>
                <span aria-hidden="true" className="text-xs text-slate-500">
                  ▾
                </span>
              </summary>
              <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <div className="border-b border-slate-200 px-2 pb-3">
                  <p className="text-sm font-semibold text-slate-950">{admin.displayName}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{admin.email}</p>
                </div>
                <Link
                  href="/"
                  className="mt-2 block rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Return to public site
                </Link>
                <form action={logoutAction} className="mt-1">
                  <button
                    type="submit"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
