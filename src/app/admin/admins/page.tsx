import type { Metadata } from "next";
import Link from "next/link";
import { AdminRole } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/features/admin-management/components/administrator-forms";
import {
  ADMIN_ROLE_LABELS,
  type AdminAccountStatusValue,
  type AdminRoleValue,
} from "@/features/admin-management/admin-ui";
import {
  countActiveSuperAdmins,
  listAdministrators,
} from "@/server/admin/admin-management-service";
import { requirePageRole } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدیریت مدیران",
};

function formatDate(date: Date | null): string {
  if (!date) {
    return "هرگز";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdministratorsPage() {
  const actor = await requirePageRole(AdminRole.SUPER_ADMIN);
  const [administrators, activeSuperAdminCount] = await Promise.all([
    listAdministrators(actor),
    countActiveSuperAdmins(actor),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminPageHeader
          eyebrow="مدیران"
          title="دسترسی امن فضای مدیریت را کنترل کنید."
          description="حساب‌های مدیران را ایجاد و مدیریت کنید. هش گذرواژه و دیگر اطلاعات محرمانه احراز هویت هرگز نمایش داده نمی‌شوند."
          actions={
            <Link
              href="/admin/admins/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              مدیر جدید
            </Link>
          }
        />

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          aria-labelledby="administrator-list-heading"
        >
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="administrator-list-heading"
                className="text-xl font-semibold tracking-tight text-slate-950"
              >
                حساب‌ها
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {administrators.length} مدیر در فضای مدیریت.
              </p>
            </div>
            <p className="text-sm text-slate-600">
              مدیران ارشد فعال:{" "}
              <span className="font-semibold text-slate-950">{activeSuperAdminCount}</span>
            </p>
          </div>

          {administrators.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[50rem] border-separate border-spacing-0 text-right">
                <caption className="sr-only">Administrator accounts</caption>
                <thead>
                  <tr className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      مدیر
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      نقش
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      وضعیت
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      آخرین ورود
                    </th>
                    <th scope="col" className="border-b border-slate-200 px-3 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {administrators.map((administrator) => (
                    <tr key={administrator.id} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-4">
                        <p className="font-semibold text-slate-950">{administrator.displayName}</p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {administrator.email}
                        </p>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-700">
                        {ADMIN_ROLE_LABELS[administrator.role as AdminRoleValue]}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4">
                        <AdminStatusBadge
                          status={administrator.status as AdminAccountStatusValue}
                          isActive={administrator.isActive}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-sm text-slate-600">
                        {formatDate(administrator.lastLoginAt)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-4 text-right">
                        <Link
                          href={`/admin/admins/${administrator.id}/edit`}
                          className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          مدیریت
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <h3 className="font-semibold text-slate-950">هنوز حساب مدیری ایجاد نشده است</h3>
              <p className="mt-2 text-sm text-slate-600">
                برای اعطای دسترسی امن به فضای مدیریت، نخستین حساب را ایجاد کنید.
              </p>
            </div>
          )}
        </section>

        <p className="text-xs leading-5 text-slate-500">
          عملیات مدیریت حساب‌ها در گزارش فعالیت ثبت می‌شوند، بدون آن‌که گذرواژه، هش یا اطلاعات
          محرمانه ذخیره شود.
        </p>
      </div>
    </div>
  );
}
