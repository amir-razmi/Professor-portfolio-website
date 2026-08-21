import { PublicationCard } from "./publication-card";
import { PublicEmptyState } from "./public-empty-state";
import { PublicPageHeader } from "./public-page-header";

import type { PublicPublication } from "../server/public-content-repository";
import type { ProfessorProfileRecord } from "@/features/professor-profile/server/profile-service";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function PublicationsPageContent({
  profile,
  publications,
}: Readonly<{
  profile: ProfessorProfileRecord | null;
  publications: PublicPublication[];
}>) {
  return (
    <>
      <PublicPageHeader
        eyebrow="انتشارات"
        title="آثار علمی منتشرشده"
        description={
          profile?.fullName
            ? `مروری عمومی بر آثار علمی منتخب ${profile.fullName}.`
            : "مروری عمومی بر مقاله‌ها، فصل‌ها و دیگر آثار علمی."
        }
      />
      <Container className="py-16 sm:py-20 lg:py-24">
        <section>
          <SectionHeading
            eyebrow="کتاب‌شناسی"
            title="مقاله‌ها، فصل‌ها و دیگر آثار"
            description="فقط آثار منتشرشده نمایش داده می‌شوند. برای جزئیات بیشتر از DOI، رکورد خارجی یا پیوند PDF استفاده کنید."
          />
          {publications.length ? (
            <div id="publications-list" className="mt-10 grid gap-5 lg:grid-cols-2">
              {publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <PublicEmptyState
                headingLevel="h3"
                title="هنوز اثر علمی عمومی وجود ندارد."
                description="آثار علمی پس از آماده‌سازی و انتشار در این بخش نمایش داده می‌شوند."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
