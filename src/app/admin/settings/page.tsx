import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SettingsForm } from "@/features/site-settings/components/settings-form";
import { Permission } from "@/server/auth/authorization";
import { getSiteSettingsForAdmin } from "@/features/site-settings/server/settings-service";
import { requirePagePermission } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "تنظیمات سایت",
};

export default async function AdminSettingsPage() {
  const admin = await requirePagePermission(Permission.MANAGE_SITE_SETTINGS);
  const settings = await getSiteSettingsForAdmin(admin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="تنظیمات سایت"
          title="نحوه ارائه سایت عمومی را تنظیم کنید."
          description="نام عمومی، توضیح، تنظیمات منطقه‌ای، تصویر اشتراک‌گذاری و پیام تعمیر و نگهداری را مدیریت کنید."
        />

        {!settings ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
            هنوز رکوردی برای تنظیمات سایت وجود ندارد. با ذخیره این فرم، تنظیمات پیش‌فرض ایجاد
            می‌شود.
          </div>
        ) : null}

        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
