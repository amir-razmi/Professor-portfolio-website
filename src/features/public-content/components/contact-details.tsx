import type { ProfessorProfileRecord } from "@/features/professor-profile/server/profile-service";
import type { SiteSettingsRecord } from "@/features/site-settings/server/settings-service";

import { AcademicLinks } from "./academic-links";

export function ContactDetails({
  profile,
  showLinks = true,
  settings,
}: Readonly<{
  profile: ProfessorProfileRecord | null;
  showLinks?: boolean;
  settings?: SiteSettingsRecord | null;
}>) {
  if (!profile) {
    return (
      <p className="text-sm leading-7 text-muted">
        اطلاعات تماس پس از انتشار پروفایل عمومی استاد در اینجا نمایش داده می‌شود.
      </p>
    );
  }

  const email = profile.email ?? settings?.contactEmail ?? null;
  const hasContact = Boolean(email || profile.phone || profile.office);

  return (
    <div className="space-y-8">
      {hasContact ? (
        <dl className="grid gap-5 sm:grid-cols-2">
          {email ? (
            <div>
              <dt className="text-sm font-semibold text-slate-950">ایمیل</dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${email}`}
                  className="text-sm leading-6 text-muted underline decoration-accent/50 underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  {email}
                </a>
              </dd>
            </div>
          ) : null}
          {profile.phone ? (
            <div>
              <dt className="text-sm font-semibold text-slate-950">تلفن</dt>
              <dd className="mt-1 text-sm leading-6 text-muted">{profile.phone}</dd>
            </div>
          ) : null}
          {profile.office ? (
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-slate-950">دفتر</dt>
              <dd className="mt-1 text-sm leading-6 text-muted">{profile.office}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm leading-7 text-muted">اطلاعات تماس هنوز منتشر نشده است.</p>
      )}
      {showLinks ? <AcademicLinks profile={profile} /> : null}
    </div>
  );
}
