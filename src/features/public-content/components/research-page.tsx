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
        eyebrow="Research"
        title="Questions, methods, and areas of inquiry."
        description={
          profile?.shortBio ??
          "Explore the public research projects and themes presented in this academic portfolio."
        }
      />
      <Container className="space-y-16 py-16 sm:py-20 lg:space-y-20 lg:py-24">
        <section className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="Research interests"
            title="Themes that guide the work."
            description="Concise areas of inquiry provide context for the projects below."
          />
          <InterestList
            items={profile?.researchInterests ?? []}
            emptyMessage="Research interests will be added soon."
          />
        </section>

        <section>
          <SectionHeading
            eyebrow="Research portfolio"
            title="Selected and ongoing projects."
            description="Only research records marked as public and published are shown."
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
                title="No public research records yet."
                description="Research projects will appear here after they are published."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
