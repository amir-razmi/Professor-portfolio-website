import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProfileForm } from "@/features/professor-profile/components/profile-form";
import { Permission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { getProfessorProfileForAdmin } from "@/features/professor-profile/server/profile-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Professor profile",
};

export default async function AdminProfilePage() {
  const admin = await requirePagePermission(Permission.MANAGE_PROFESSOR_PROFILE);
  const profile = await getProfessorProfileForAdmin(admin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="Professor profile"
          title="Manage the public academic profile."
          description="Keep the identity, academic background, interests, contact details, and links presented on the public site up to date."
        />

        {!profile ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
            No profile record exists yet. Complete the form below to create the first public profile
            record.
          </div>
        ) : null}

        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
