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
        eyebrow="Publications"
        title="Published scholarly work."
        description={
          profile?.fullName
            ? `A public record of selected publications by ${profile.fullName}.`
            : "A public record of selected articles, chapters, and other scholarly work."
        }
      />
      <Container className="py-16 sm:py-20 lg:py-24">
        <section>
          <SectionHeading
            eyebrow="Bibliography"
            title="Articles, chapters, and other work."
            description="Only publication records marked as published are shown. Follow the available DOI, external record, or PDF link for more detail."
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
                title="No public publications yet."
                description="Published scholarly records will appear here when they are ready."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
