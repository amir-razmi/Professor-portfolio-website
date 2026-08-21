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
  const title = profile?.fullName ? `About ${profile.fullName}` : "About the academic profile";
  const description =
    profile?.shortBio ??
    settings?.siteDescription ??
    "Learn about the academic background, interests, and work presented in this portfolio.";

  return (
    <>
      <PublicPageHeader eyebrow="About" title={title} description={description} />
      <Container className="space-y-16 py-16 sm:py-20 lg:space-y-20 lg:py-24">
        {!profile ? (
          <PublicEmptyState
            title="The public profile is being prepared."
            description="Biography and academic record information will appear here after an administrator publishes the profile."
          />
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Academic identity
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {profile.title ?? "Academic profile"}
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
                eyebrow="Biography"
                title="The work in context."
                description="A longer account of the academic path and current practice."
              />
              <Surface className="bg-white">
                <p className="whitespace-pre-line text-base leading-8 text-muted">
                  {profile.biography ??
                    profile.shortBio ??
                    "Biography information is not available yet."}
                </p>
              </Surface>
            </section>

            <section>
              <SectionHeading
                eyebrow="Academic record"
                title="Education, positions, experience, and recognition."
                description="A concise record of the experiences that shape the work."
              />
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <AcademicRecordList title="Education" items={profile.education} />
                <AcademicRecordList title="Academic positions" items={profile.academicPositions} />
                <AcademicRecordList title="Experience" items={profile.experience} />
                <AcademicRecordList title="Awards" items={profile.awards} />
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div>
                <SectionHeading
                  eyebrow="Research"
                  title="Areas of inquiry."
                  description="Themes that guide current research and collaboration."
                />
                <div className="mt-8">
                  <InterestList
                    items={profile.researchInterests}
                    emptyMessage="Research interests will be added soon."
                  />
                </div>
              </div>
              <div>
                <SectionHeading
                  eyebrow="Teaching"
                  title="Learning and practice."
                  description="Teaching interests maintained alongside the research profile."
                />
                <div className="mt-8">
                  <InterestList
                    items={profile.teachingInterests}
                    emptyMessage="Teaching interests will be added soon."
                  />
                </div>
              </div>
            </section>

            <section>
              <SectionHeading
                eyebrow="Contact"
                title="Connect around the work."
                description="Published contact details and academic links for professional correspondence."
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
