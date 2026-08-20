import type { ReactNode } from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Permission, hasPermission } from "@/server/auth/permissions";
import { getDashboardSummary } from "@/features/admin-dashboard/server/dashboard-service";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null, timezone: string): string {
  if (!date) {
    return "Not created yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary();
  const canManageProfile = hasPermission(summary.admin, Permission.MANAGE_PROFESSOR_PROFILE);
  const canManageSettings = hasPermission(summary.admin, Permission.MANAGE_SITE_SETTINGS);
  const timezone = summary.settings.timezone;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <AdminPageHeader
          eyebrow="Dashboard"
          title={`Welcome back, ${summary.admin.displayName}.`}
          description="Use this workspace to keep the public academic profile and site-wide presentation accurate."
        />

        <section aria-labelledby="status-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="status-heading" className="text-lg font-semibold text-slate-950">
                Content status
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                A quick view of the records that shape the public site.
              </p>
            </div>
            <Link
              href="/"
              className="hidden text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:inline"
            >
              Open public site
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <StatusCard
              title="Professor profile"
              status={
                !summary.profile.exists
                  ? "Not created"
                  : summary.profile.isPublished
                    ? "Published"
                    : "Draft"
              }
              detail={`Last updated ${formatDate(summary.profile.updatedAt, timezone)}`}
              action={
                canManageProfile ? (
                  <Link
                    href="/admin/profile"
                    className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    Manage profile
                  </Link>
                ) : null
              }
            />
            <StatusCard
              title="Site settings"
              status={
                !summary.settings.exists
                  ? "Not created"
                  : summary.settings.maintenanceMode
                    ? "Maintenance notice on"
                    : "Active"
              }
              detail={
                summary.settings.siteName
                  ? `${summary.settings.siteName} · updated ${formatDate(summary.settings.updatedAt, timezone)}`
                  : `Last updated ${formatDate(summary.settings.updatedAt, timezone)}`
              }
              action={
                canManageSettings ? (
                  <Link
                    href="/admin/settings"
                    className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    Manage settings
                  </Link>
                ) : null
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Your access</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Account</dt>
              <dd className="mt-1 break-all font-medium text-slate-950">{summary.admin.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {summary.admin.role.replace("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Next step</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {canManageProfile || canManageSettings
                  ? "Review public content"
                  : "Use the workspace available to your role"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function StatusCard({
  action,
  detail,
  status,
  title,
}: Readonly<{
  action: ReactNode;
  detail: string;
  status: string;
  title: string;
}>) {
  return (
    <article className="flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{status}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{detail}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </article>
  );
}
