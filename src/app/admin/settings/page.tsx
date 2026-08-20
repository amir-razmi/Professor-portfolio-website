import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm } from "@/features/site-settings/components/settings-form";
import { Permission } from "@/server/auth/authorization";
import { getSiteSettingsForAdmin } from "@/features/site-settings/server/settings-service";
import { requirePagePermission } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site settings",
};

export default async function AdminSettingsPage() {
  const admin = await requirePagePermission(Permission.MANAGE_SITE_SETTINGS);
  const settings = await getSiteSettingsForAdmin(admin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="Site settings"
          title="Control the public site's presentation."
          description="Manage the public name, description, regional defaults, sharing image placeholder, and maintenance notice."
        />

        {!settings ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
            No site settings record exists yet. Saving this form will create the default settings
            record.
          </div>
        ) : null}

        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
