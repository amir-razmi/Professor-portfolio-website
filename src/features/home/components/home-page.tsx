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
    [profile?.title, profile?.department].filter(Boolean).join(" · ") || "Academic portfolio";

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
              {profile?.fullName ?? "Academic profile"}
            </h1>
            <p className="mt-5 text-xl text-orange-100">{identityLine}</p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {profile?.shortBio ??
                profile?.biography ??
                "Research, teaching, and academic work presented in one clear public portfolio."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/research"
                className="rounded-full bg-orange-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Explore research
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="flex justify-start lg:justify-end">
            {profileImageUrl && profile ? (
              <Image
                src={profileImageUrl}
                alt={`${profile.fullName} profile`}
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
                Public academic portfolio
              </div>
            )}
          </div>
        </Container>
      </section>

      <section id="about" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="About"
            title="A clear account of the work."
            description="Read the biography, academic record, and areas of interest maintained in the public profile."
          />
          <div className="space-y-5">
            {profile ? (
              <Surface className="bg-white">
                <p className="whitespace-pre-line text-base leading-8 text-muted">
                  {profile.biography ??
                    profile.shortBio ??
                    "Biography information is not available yet."}
                </p>
                <Link
                  href="/about"
                  className="mt-6 inline-flex rounded-lg text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Read the full profile
                </Link>
              </Surface>
            ) : (
              <PublicEmptyState
                title="The public profile is being prepared."
                description="Biography and academic record information will appear here after an administrator publishes the profile."
              />
            )}
          </div>
        </Container>
      </section>

      <section id="research" className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24">
        <Container className="space-y-10">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <SectionHeading
              eyebrow="Research"
              title="Questions, methods, and areas of inquiry."
              description="Research interests and selected public projects are presented as concise, readable themes."
            />
            <InterestList
              items={profile?.researchInterests ?? []}
              emptyMessage="Research interests will be added soon."
            />
          </div>
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Selected research
              </h2>
              <Link
                href="/research"
                className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                View all research
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
                  title="Research projects are being prepared."
                  description="Public research records will appear here when they are published."
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
            emptyMessage="Teaching interests will be added soon."
          />
          <SectionHeading
            eyebrow="Teaching"
            title="Learning grounded in thoughtful practice."
            description="Teaching interests and experience are maintained alongside the academic profile."
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
              eyebrow="Publications"
              title="Selected scholarly work."
              description="A small selection of published work, with the complete public record available on the publications page."
            />
            <Link
              href="/publications"
              className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              View all publications
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
              title="Publications are being prepared."
              description="Published articles, chapters, and other scholarly records will appear here when they are ready."
            />
          )}
        </Container>
      </section>

      <section id="experience" className="scroll-mt-24 py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="Academic record"
            title="Education, positions, experience, and recognition."
            description="These records are intentionally simple to maintain and easy to scan."
          />
          {profile ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <AcademicRecordList title="Education" items={profile.education} />
              <AcademicRecordList title="Academic positions" items={profile.academicPositions} />
              <AcademicRecordList title="Experience" items={profile.experience} />
              <AcademicRecordList title="Awards" items={profile.awards} />
            </div>
          ) : (
            <div className="mt-10">
              <PublicEmptyState
                headingLevel="h3"
                title="Academic record is being prepared."
                description="Education, positions, experience, and awards will appear here after the public profile is published."
              />
            </div>
          )}
        </Container>
      </section>

      <section id="contact" className="scroll-mt-24 border-t border-line bg-white py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="Contact"
            title="A professional point of connection."
            description="Use the contact details and academic links below for collaboration, teaching, and scholarly exchange."
          />
          <Surface className="bg-white">
            <ContactDetails profile={profile} settings={settings} />
          </Surface>
        </Container>
      </section>
    </>
  );
}
