import type { Metadata } from "next";
import Link from "next/link";
import { AdminRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdministratorDetailsForm,
  AdministratorPasswordResetForm,
  AdministratorRoleForm,
  AdministratorStatusActions,
} from "@/features/admin-management/components/administrator-forms";
import { administratorIdSchema } from "@/server/admin/admin-management-policy";
import { countActiveSuperAdmins, getAdministrator } from "@/server/admin/admin-management-service";
import { requirePageRole } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit administrator",
};

export default async function EditAdministratorPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const actor = await requirePageRole(AdminRole.SUPER_ADMIN);
  const { id } = await params;

  if (!administratorIdSchema.safeParse(id).success) {
    notFound();
  }

  const [administrator, activeSuperAdminCount] = await Promise.all([
    getAdministrator(actor, id),
    countActiveSuperAdmins(actor),
  ]);

  if (!administrator) {
    notFound();
  }

  const isLastActiveSuperAdmin =
    administrator.role === AdminRole.SUPER_ADMIN &&
    administrator.isActive &&
    activeSuperAdminCount <= 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="Administrator account"
          title={administrator.displayName}
          description={`Manage account details and access for ${administrator.email}. Authentication secrets are never displayed.`}
          actions={
            <Link
              href="/admin/admins"
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Back to administrators
            </Link>
          }
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
          <div className="space-y-8">
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              aria-labelledby="admin-details-heading"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 id="admin-details-heading" className="text-xl font-semibold text-slate-950">
                  Basic information
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Update the name and email shown in the administrator workspace.
                </p>
              </div>
              <div className="mt-6">
                <AdministratorDetailsForm administrator={administrator} />
              </div>
            </section>

            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              aria-labelledby="admin-role-heading"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 id="admin-role-heading" className="text-xl font-semibold text-slate-950">
                  Role and permissions
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Role changes are enforced by the server. A SUPER_ADMIN cannot change their own
                  role or grant a role above their authority.
                </p>
              </div>
              <div className="mt-6">
                {administrator.id === actor.id ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    You are signed in as this account. Ask another SUPER_ADMIN to change this
                    account&apos;s role.
                  </p>
                ) : (
                  <AdministratorRoleForm administrator={administrator} />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              aria-labelledby="admin-status-heading"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 id="admin-status-heading" className="text-xl font-semibold text-slate-950">
                  Account status
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Deactivated accounts cannot authenticate. The last active SUPER_ADMIN is always
                  protected.
                </p>
              </div>
              <div className="mt-6">
                <AdministratorStatusActions
                  administrator={administrator}
                  currentAdminId={actor.id}
                  isLastActiveSuperAdmin={isLastActiveSuperAdmin}
                />
              </div>
            </section>

            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              aria-labelledby="admin-password-heading"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 id="admin-password-heading" className="text-xl font-semibold text-slate-950">
                  Password reset
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Set a new password through a secure handoff. Existing password data is never read
                  or displayed.
                </p>
              </div>
              <div className="mt-6">
                <AdministratorPasswordResetForm administrator={administrator} />
              </div>
            </section>

            <dl className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-right font-medium text-slate-800">
                  {administrator.createdAt.toLocaleDateString("en")}
                </dd>
              </div>
              <div className="flex justify-between gap-4 pt-3">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="text-right font-medium text-slate-800">
                  {administrator.updatedAt.toLocaleDateString("en")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
