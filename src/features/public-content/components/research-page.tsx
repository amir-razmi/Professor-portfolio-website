import { InterestList } from "./interest-list";
import { PublicEmptyState } from "./public-empty-state";
import { PublicPageHeader } from "./public-page-header";
import { ResearchCard } from "./research-card";

import type { PublicResearchItem } from "../server/public-content-repository";
import type { ProfessorProfileRecord } from "@/features/professor-profile/server/profile-service";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function ResearchPageContent({
  profile,
  researchItems,
}: Readonly<{
  profile: ProfessorProfileRecord | null;
  researchItems: PublicResearchItem[];
}>) {
  return (
    <>
      <PublicPageHeader
        eyebrow="پژوهش"
        title="پرسش‌ها، روش‌ها و حوزه‌های تحقیق"
        description={
          profile?.shortBio ??
          "پروژه‌ها و موضوعات پژوهشی عمومی این پرتفولیوی دانشگاهی را مرور کنید."
        }
      />
      <Container className="space-y-16 py-16 sm:py-20 lg:space-y-20 lg:py-24">
        <section className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="علایق پژوهشی"
            title="موضوعات محوری فعالیت‌ها"
            description="حوزه‌های تحقیق، زمینه لازم برای درک پروژه‌های زیر را فراهم می‌کنند."
          />
          <InterestList
            items={profile?.researchInterests ?? []}
            emptyMessage="علایق پژوهشی به‌زودی اضافه می‌شوند."
          />
        </section>

        <section>
          <SectionHeading
            eyebrow="پرتفولیوی پژوهش"
            title="پروژه‌های منتخب و در حال اجرا"
            description="فقط رکوردهای پژوهشی عمومی و منتشرشده نمایش داده می‌شوند."
          />
          {researchItems.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {researchItems.map((item) => (
                <ResearchCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <PublicEmptyState
                headingLevel="h3"
                title="هنوز رکورد پژوهشی عمومی وجود ندارد."
                description="پس از انتشار پروژه‌های پژوهشی، آن‌ها در این بخش نمایش داده می‌شوند."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
