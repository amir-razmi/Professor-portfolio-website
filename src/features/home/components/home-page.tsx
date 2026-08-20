import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { getPublicPortfolioContent } from "@/features/public-content/server/public-content-service";

function safeExternalUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function displayLinkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function HomeFeaturePage() {
  const { profile, settings } = await getPublicPortfolioContent();
  const siteName = settings?.siteName ?? "Academic Portfolio";

  if (!profile) {
    return (
      <section className="border-b border-line bg-slate-950 text-white">
        <Container className="py-24 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-200">
            {siteName}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            The academic profile is being prepared.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Public profile content will appear here after an administrator publishes it.
          </p>
        </Container>
      </section>
    );
  }

  const profileImageUrl = safeExternalUrl(profile.profileImageUrl);
  const links = [
    ["Website", profile.websiteUrl],
    ["ORCID", profile.orcid],
    ["Google Scholar", profile.googleScholarUrl],
    ["ResearchGate", profile.researchGateUrl],
    ["LinkedIn", profile.linkedinUrl],
    ["GitHub", profile.githubUrl],
  ].flatMap(([label, value]) => {
    const url = safeExternalUrl(value);
    return url ? [{ label, url }] : [];
  });
  const contactEmail = profile.email ? `mailto:${profile.email}` : null;

  return (
    <>
      <section
        id="overview"
        className="relative overflow-hidden border-b border-line bg-slate-950 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(154,91,50,0.35),transparent_42%)]" />
        <Container className="relative grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-orange-200">
              {profile.institution ?? siteName}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {profile.fullName}
            </h1>
            <p className="mt-5 text-xl text-orange-100">
              {[profile.title, profile.department].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {profile.shortBio ?? profile.biography ?? "Academic work, teaching, and research."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="#research"
                className="rounded-full bg-orange-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Explore research
              </Link>
              <Link
                href="#contact"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="flex justify-start lg:justify-end">
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt={`${profile.fullName} profile`}
                className="size-56 rounded-3xl border border-white/20 object-cover shadow-2xl sm:size-64"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-56 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-center text-sm font-semibold text-orange-100 sm:size-64">
                {profile.fullName}
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
            description="The biography below is managed from the protected administration workspace."
          />
          <Surface className="bg-white">
            <p className="whitespace-pre-line text-base leading-8 text-muted">
              {profile.biography ??
                profile.shortBio ??
                "Biography information is not available yet."}
            </p>
          </Surface>
        </Container>
      </section>

      <section id="research" className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="Research"
            title="Questions, methods, and areas of inquiry."
            description="Research interests are presented as concise, readable themes."
          />
          <InterestList
            items={profile.researchInterests}
            emptyMessage="Research interests will be added soon."
          />
        </Container>
      </section>

      <section id="teaching" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <InterestList
            items={profile.teachingInterests}
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
        id="experience"
        className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24"
      >
        <Container>
          <SectionHeading
            eyebrow="Academic record"
            title="Education, positions, experience, and recognition."
            description="These records are intentionally simple to maintain and easy to scan."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <RecordList title="Education" items={profile.education} />
            <RecordList title="Academic positions" items={profile.academicPositions} />
            <RecordList title="Experience" items={profile.experience} />
            <RecordList title="Awards" items={profile.awards} />
          </div>
        </Container>
      </section>

      <section id="contact" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeading
            eyebrow="Contact"
            title="A professional point of connection."
            description="Use the contact details and academic links below for collaboration, teaching, and scholarly exchange."
          />
          <Surface className="bg-white">
            <div className="space-y-5 text-sm">
              {contactEmail ? (
                <ContactRow href={contactEmail} label="Email" value={profile.email ?? ""} />
              ) : null}
              {profile.phone ? <ContactRow label="Phone" value={profile.phone} /> : null}
              {profile.office ? <ContactRow label="Office" value={profile.office} /> : null}
              {links.length ? (
                <div>
                  <p className="font-semibold text-slate-950">Academic and social links</p>
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-line px-3 py-2 font-medium text-accent transition hover:border-accent hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {link.label}
                          <span className="sr-only"> ({displayLinkLabel(link.url)})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {!contactEmail && !profile.phone && !profile.office && !links.length ? (
                <p className="leading-7 text-muted">Contact information will be added soon.</p>
              ) : null}
            </div>
          </Surface>
        </Container>
      </section>
    </>
  );
}

function InterestList({
  emptyMessage,
  items,
}: Readonly<{
  emptyMessage: string;
  items: readonly string[];
}>) {
  return items.length ? (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-line bg-white p-5 text-base leading-7 text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <Surface className="bg-white">
      <p className="text-sm leading-7 text-muted">{emptyMessage}</p>
    </Surface>
  );
}

function RecordList({
  items,
  title,
}: Readonly<{
  items: readonly string[];
  title: string;
}>) {
  return (
    <Surface className="h-full bg-slate-50">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="border-l-2 border-accent/50 pl-4 text-sm leading-6 text-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted">No entries published yet.</p>
      )}
    </Surface>
  );
}

function ContactRow({
  href,
  label,
  value,
}: Readonly<{
  href?: string;
  label: string;
  value: string;
}>) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{label}</p>
      {href ? (
        <a
          href={href}
          className="mt-1 inline-block text-muted underline decoration-accent/50 underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-muted">{value}</p>
      )}
    </div>
  );
}
