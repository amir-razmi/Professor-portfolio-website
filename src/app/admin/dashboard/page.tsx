import type { ReactNode } from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Permission, hasPermission } from "@/server/auth/permissions";
import { getDashboardSummary } from "@/features/admin-dashboard/server/dashboard-service";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null, timezone: string): string {
  if (!date) {
    return "هنوز ایجاد نشده است";
  }

  return new Intl.DateTimeFormat("fa-IR", {
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
          eyebrow="داشبورد"
          title={`خوش آمدید، ${summary.admin.displayName}.`}
          description="از این فضای مدیریت برای به‌روز نگه‌داشتن پروفایل دانشگاهی و محتوای عمومی سایت استفاده کنید."
        />

        <section aria-labelledby="status-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="status-heading" className="text-lg font-semibold text-slate-950">
                وضعیت محتوا
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                نمایی سریع از رکوردهایی که محتوای سایت عمومی را شکل می‌دهند.
              </p>
            </div>
            <Link
              href="/"
              className="hidden text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:inline"
            >
              مشاهده سایت عمومی
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <StatusCard
              title="پروفایل استاد"
              status={
                !summary.profile.exists
                  ? "ایجاد نشده"
                  : summary.profile.isPublished
                    ? "منتشرشده"
                    : "پیش‌نویس"
              }
              detail={`آخرین به‌روزرسانی: ${formatDate(summary.profile.updatedAt, timezone)}`}
              action={
                canManageProfile ? (
                  <Link
                    href="/admin/profile"
                    className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    مدیریت پروفایل
                  </Link>
                ) : null
              }
            />
            <StatusCard
              title="تنظیمات سایت"
              status={
                !summary.settings.exists
                  ? "ایجاد نشده"
                  : summary.settings.maintenanceMode
                    ? "حالت تعمیر و نگهداری فعال"
                    : "فعال"
              }
              detail={
                summary.settings.siteName
                  ? `${summary.settings.siteName} · به‌روزرسانی ${formatDate(summary.settings.updatedAt, timezone)}`
                  : `آخرین به‌روزرسانی: ${formatDate(summary.settings.updatedAt, timezone)}`
              }
              action={
                canManageSettings ? (
                  <Link
                    href="/admin/settings"
                    className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    مدیریت تنظیمات
                  </Link>
                ) : null
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">دسترسی شما</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">حساب کاربری</dt>
              <dd className="mt-1 break-all font-medium text-slate-950">{summary.admin.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">نقش</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {summary.admin.role.replace("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">گام بعدی</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {canManageProfile || canManageSettings
                  ? "بازبینی محتوای عمومی"
                  : "از امکانات متناسب با نقش خود استفاده کنید"}
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
