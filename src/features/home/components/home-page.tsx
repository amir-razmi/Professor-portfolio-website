import Link from "next/link";
import Image from "next/image";

import { AcademicRecordList } from "@/features/public-content/components/academic-record-list";
import { ContactDetails } from "@/features/public-content/components/contact-details";
import { InterestList } from "@/features/public-content/components/interest-list";
import { PublicationCard } from "@/features/public-content/components/publication-card";
import { PublicEmptyState } from "@/features/public-content/components/public-empty-state";
import { ResearchCard } from "@/features/public-content/components/research-card";
import { safeExternalUrl } from "@/features/public-content/components/public-content-utils";
import { getSelectedPublicAcademicContent } from "@/features/public-content/server/public-content-service";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { siteConfig } from "@/config/site";

export default async function HomeFeaturePage() {
  const { profile, settings, researchItems, publications } =
    await getSelectedPublicAcademicContent();
  const siteName = settings?.siteName ?? siteConfig.name;
  const profileImageUrl = safeExternalUrl(profile?.profileImageUrl);
  const identityLine =
    [profile?.title, profile?.department].filter(Boolean).join(" · ") || "پرتفولیوی دانشگاهی";

  return (
    <>
      <section
        id="overview"
        className="relative scroll-mt-24 overflow-hidden border-b border-line bg-slate-950 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(154,91,50,0.35),transparent_42%)]" />
        <Container className="relative grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-orange-200">
              {profile?.institution ?? siteName}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {profile?.fullName ?? "پروفایل دانشگاهی"}
            </h1>
            <p className="mt-5 text-xl text-orange-100">{identityLine}</p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {profile?.shortBio ??
                profile?.biography ??
                "پژوهش، آموزش و فعالیت‌های دانشگاهی در یک پرتفولیوی روشن و منسجم."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/research"
                className="rounded-full bg-orange-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                مشاهده پژوهش‌ها
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                تماس
              </Link>
            </div>
          </div>

          <div className="flex justify-start lg:justify-end">
            {profileImageUrl && profile ? (
              <Image
                src={profileImageUrl}
                alt={`تصویر پروفایل ${profile.fullName}`}
                width={256}
                height={256}
                sizes="(max-width: 1024px) 224px, 256px"
                preload
                unoptimized
                className="size-56 rounded-3xl border border-white/20 object-cover shadow-2xl sm:size-64"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-56 items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-6 text-center text-sm font-semibold text-orange-100 sm:size-64">
                پرتفولیوی دانشگاهی عمومی
              </div>
            )}
          </div>
        </Container>
      </section>

      <section id="about" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="درباره"
            title="روایتی روشن از فعالیت‌ها"
            description="زندگی‌نامه، سوابق دانشگاهی و حوزه‌های علاقه‌مندی درج‌شده در پروفایل عمومی را بخوانید."
          />
          <div className="space-y-5">
            {profile ? (
              <Surface className="bg-white">
                <p className="whitespace-pre-line text-base leading-8 text-muted">
                  {profile.biography ??
                    profile.shortBio ??
                    "اطلاعات زندگی‌نامه هنوز در دسترس نیست."}
                </p>
                <Link
                  href="/about"
                  className="mt-6 inline-flex rounded-lg text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  مطالعه پروفایل کامل
                </Link>
              </Surface>
            ) : (
              <PublicEmptyState
                title="پروفایل عمومی در حال آماده‌سازی است."
                description="پس از انتشار پروفایل توسط مدیر، زندگی‌نامه و سوابق دانشگاهی در این بخش نمایش داده می‌شود."
              />
            )}
          </div>
        </Container>
      </section>

      <section id="research" className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24">
        <Container className="space-y-10">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <SectionHeading
              eyebrow="پژوهش"
              title="پرسش‌ها، روش‌ها و حوزه‌های تحقیق"
              description="علایق پژوهشی و پروژه‌های عمومی منتخب در قالب موضوعاتی روشن و خوانا ارائه می‌شوند."
            />
            <InterestList
              items={profile?.researchInterests ?? []}
              emptyMessage="علایق پژوهشی به‌زودی اضافه می‌شوند."
            />
          </div>
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                پژوهش‌های منتخب
              </h2>
              <Link
                href="/research"
                className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                مشاهده همه پژوهش‌ها
              </Link>
            </div>
            {researchItems.length ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {researchItems.map((item) => (
                  <ResearchCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <PublicEmptyState
                  headingLevel="h3"
                  title="پروژه‌های پژوهشی در حال آماده‌سازی هستند."
                  description="رکوردهای پژوهشی پس از انتشار در این بخش نمایش داده می‌شوند."
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      <section id="teaching" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <InterestList
            items={profile?.teachingInterests ?? []}
            emptyMessage="علایق آموزشی به‌زودی اضافه می‌شوند."
          />
          <SectionHeading
            eyebrow="آموزش"
            title="یادگیری بر پایه تجربه و اندیشه"
            description="علایق و تجربه آموزشی در کنار پروفایل دانشگاهی نگهداری می‌شوند."
          />
        </Container>
      </section>

      <section
        id="publications"
        className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24"
      >
        <Container className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="انتشارات"
              title="آثار علمی منتخب"
              description="گزیده‌ای از آثار منتشرشده؛ فهرست کامل در صفحه انتشارات در دسترس است."
            />
            <Link
              href="/publications"
              className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              مشاهده همه انتشارات
            </Link>
          </div>
          {publications.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <PublicEmptyState
              headingLevel="h3"
              title="آثار علمی در حال آماده‌سازی هستند."
              description="مقاله‌ها، فصل‌ها و دیگر آثار علمی پس از آماده‌شدن در این بخش نمایش داده می‌شوند."
            />
          )}
        </Container>
      </section>

      <section id="experience" className="scroll-mt-24 py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="سوابق دانشگاهی"
            title="تحصیلات، سمت‌ها، تجربه و افتخارات"
            description="این سوابق ساده و قابل مرور نگهداری می‌شوند."
          />
          {profile ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <AcademicRecordList title="تحصیلات" items={profile.education} />
              <AcademicRecordList title="سمت‌های دانشگاهی" items={profile.academicPositions} />
              <AcademicRecordList title="تجربه" items={profile.experience} />
              <AcademicRecordList title="افتخارات" items={profile.awards} />
            </div>
          ) : (
            <div className="mt-10">
              <PublicEmptyState
                headingLevel="h3"
                title="سوابق دانشگاهی در حال آماده‌سازی است."
                description="پس از انتشار پروفایل عمومی، تحصیلات، سمت‌ها، تجربه و افتخارات در این بخش نمایش داده می‌شوند."
              />
            </div>
          )}
        </Container>
      </section>

      <section id="contact" className="scroll-mt-24 border-t border-line bg-white py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="تماس"
            title="راهی برای ارتباط حرفه‌ای"
            description="برای همکاری، آموزش و تبادل علمی از اطلاعات تماس و لینکهای علمی زیر استفاده کنید."
          />
          <Surface className="bg-white">
            <ContactDetails profile={profile} settings={settings} />
          </Surface>
        </Container>
      </section>
    </>
  );
}
