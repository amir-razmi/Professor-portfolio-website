import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProfileForm } from "@/features/professor-profile/components/profile-form";
import { Permission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { getProfessorProfileForAdmin } from "@/features/professor-profile/server/profile-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "پروفایل استاد",
};

export default async function AdminProfilePage() {
  const admin = await requirePagePermission(Permission.MANAGE_PROFESSOR_PROFILE);
  const profile = await getProfessorProfileForAdmin(admin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="پروفایل استاد"
          title="پروفایل دانشگاهی عمومی را مدیریت کنید."
          description="هویت، پیشینه دانشگاهی، علایق، اطلاعات تماس و لینکهای نمایش‌داده‌شده در سایت را به‌روز نگه دارید."
        />

        {!profile ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
            هنوز رکوردی برای پروفایل وجود ندارد. برای ایجاد نخستین پروفایل عمومی، فرم زیر را تکمیل
            کنید.
          </div>
        ) : null}

        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
