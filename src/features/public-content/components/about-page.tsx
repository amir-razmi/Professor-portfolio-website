import Image from "next/image";

import { AcademicLinks } from "./academic-links";
import { AcademicRecordList } from "./academic-record-list";
import { ContactDetails } from "./contact-details";
import { InterestList } from "./interest-list";
import { PublicEmptyState } from "./public-empty-state";
import { PublicPageHeader } from "./public-page-header";
import { safeExternalUrl } from "./public-content-utils";

import type { PublicPortfolioContent } from "../server/public-content-service";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

export function AboutPageContent({ profile, settings }: Readonly<PublicPortfolioContent>) {
  const profileImageUrl = safeExternalUrl(profile?.profileImageUrl);
  const title = profile?.fullName ? `درباره ${profile.fullName}` : "درباره پروفایل دانشگاهی";
  const description =
    profile?.shortBio ??
    settings?.siteDescription ??
    "با پیشینه دانشگاهی، علایق پژوهشی و فعالیت‌های ارائه‌شده در این پرتفولیو آشنا شوید.";

  return (
    <>
      <PublicPageHeader eyebrow="درباره" title={title} description={description} />
      <Container className="space-y-16 py-16 sm:py-20 lg:space-y-20 lg:py-24">
        {!profile ? (
          <PublicEmptyState
            title="پروفایل عمومی در حال آماده‌سازی است."
            description="پس از انتشار پروفایل توسط مدیر، زندگی‌نامه و سوابق دانشگاهی در این بخش نمایش داده می‌شود."
          />
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Academic identity
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {profile.title ?? "پروفایل دانشگاهی"}
                </p>
                {profile.department || profile.institution ? (
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {[profile.department, profile.institution].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
              <Surface className="bg-white">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt={`${profile.fullName} profile`}
                      width={128}
                      height={128}
                      sizes="128px"
                      unoptimized
                      className="size-32 rounded-2xl border border-line object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {profile.fullName}
                    </p>
                    {profile.shortBio ? (
                      <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted">
                        {profile.shortBio}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Surface>
            </section>

            <section className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <SectionHeading
                eyebrow="زندگی‌نامه"
                title="مسیر علمی و حرفه‌ای"
                description="روایتی جامع‌تر از مسیر دانشگاهی و فعالیت‌های کنونی."
              />
              <Surface className="bg-white">
                <p className="whitespace-pre-line text-base leading-8 text-muted">
                  {profile.biography ??
                    profile.shortBio ??
                    "اطلاعات زندگی‌نامه هنوز در دسترس نیست."}
                </p>
              </Surface>
            </section>

            <section>
              <SectionHeading
                eyebrow="سوابق دانشگاهی"
                title="تحصیلات، سمت‌ها، تجربه و افتخارات"
                description="مروری کوتاه بر تجربه‌هایی که مسیر این فعالیت‌ها را شکل داده‌اند."
              />
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <AcademicRecordList title="تحصیلات" items={profile.education} />
                <AcademicRecordList title="سمت‌های دانشگاهی" items={profile.academicPositions} />
                <AcademicRecordList title="تجربه" items={profile.experience} />
                <AcademicRecordList title="افتخارات" items={profile.awards} />
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div>
                <SectionHeading
                  eyebrow="پژوهش"
                  title="حوزه‌های تحقیق"
                  description="موضوعاتی که پژوهش و همکاری‌های علمی را هدایت می‌کنند."
                />
                <div className="mt-8">
                  <InterestList
                    items={profile.researchInterests}
                    emptyMessage="علایق پژوهشی به‌زودی اضافه می‌شوند."
                  />
                </div>
              </div>
              <div>
                <SectionHeading
                  eyebrow="آموزش"
                  title="یادگیری و عمل"
                  description="علایق آموزشی در کنار مسیر پژوهشی دنبال می‌شوند."
                />
                <div className="mt-8">
                  <InterestList
                    items={profile.teachingInterests}
                    emptyMessage="علایق آموزشی به‌زودی اضافه می‌شوند."
                  />
                </div>
              </div>
            </section>

            <section>
              <SectionHeading
                eyebrow="تماس"
                title="در ارتباط باشید"
                description="اطلاعات تماس و لینکهای علمی برای مکاتبات حرفه‌ای."
              />
              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <Surface className="bg-white">
                  <ContactDetails profile={profile} settings={settings} showLinks={false} />
                </Surface>
                <Surface className="bg-white">
                  <AcademicLinks profile={profile} />
                </Surface>
              </div>
            </section>
          </>
        )}
      </Container>
    </>
  );
}
