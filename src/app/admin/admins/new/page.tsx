import type { Metadata } from "next";
import Link from "next/link";
import { AdminRole } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdministratorCreateForm } from "@/features/admin-management/components/administrator-forms";
import { requirePageRole } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New administrator",
};

export default async function NewAdministratorPage() {
  await requirePageRole(AdminRole.SUPER_ADMIN);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <AdminPageHeader
          eyebrow="New administrator"
          title="Create a trusted account."
          description="Set a role, account status, and initial password. The account can sign in only when it is active."
          actions={
            <Link
              href="/admin/admins"
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Back to administrators
            </Link>
          }
        />
        <AdministratorCreateForm />
      </div>
    </div>
  );
}
