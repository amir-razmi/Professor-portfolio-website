import { ContactDetails } from "./contact-details";
import { PublicEmptyState } from "./public-empty-state";
import { PublicPageHeader } from "./public-page-header";

import type { PublicPortfolioContent } from "../server/public-content-service";
import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";

export function ContactPageContent({ profile, settings }: Readonly<PublicPortfolioContent>) {
  const identity = profile?.fullName
    ? `با ${profile.fullName} در ارتباط باشید.`
    : "راهی برای ارتباط حرفه‌ای.";

  return (
    <>
      <PublicPageHeader
        eyebrow="تماس"
        title="برای پژوهش، آموزش و فعالیت دانشگاهی در ارتباط باشید"
        description={
          profile?.shortBio ??
          settings?.siteDescription ??
          "برای مکاتبات حرفه‌ای از اطلاعات تماس و لینکهای علمی زیر استفاده کنید."
        }
      />
      <Container className="py-16 sm:py-20 lg:py-24">
        {profile ? (
          <section className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                {profile.institution ?? "پرتفولیوی دانشگاهی"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {identity}
              </h2>
              {profile.department || profile.title ? (
                <p className="mt-4 text-base leading-7 text-muted">
                  {[profile.title, profile.department].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
            <Surface className="bg-white">
              <ContactDetails profile={profile} settings={settings} />
            </Surface>
          </section>
        ) : (
          <PublicEmptyState
            title="اطلاعات تماس در حال آماده‌سازی است."
            description="پس از تکمیل پروفایل عمومی توسط مدیر، اطلاعات تماس در این بخش نمایش داده می‌شود."
          />
        )}
      </Container>
    </>
  );
}
