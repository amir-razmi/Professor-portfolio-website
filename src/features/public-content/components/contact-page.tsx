import { ContactDetails } from "./contact-details";
import { PublicEmptyState } from "./public-empty-state";
import { PublicPageHeader } from "./public-page-header";

import type { PublicPortfolioContent } from "../server/public-content-service";
import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";

export function ContactPageContent({ profile, settings }: Readonly<PublicPortfolioContent>) {
  const identity = profile?.fullName
    ? `Get in touch with ${profile.fullName}.`
    : "A professional point of connection.";

  return (
    <>
      <PublicPageHeader
        eyebrow="Contact"
        title="Connect around research, teaching, and academic work."
        description={
          profile?.shortBio ??
          settings?.siteDescription ??
          "Use the published contact details and academic links below for professional correspondence."
        }
      />
      <Container className="py-16 sm:py-20 lg:py-24">
        {profile ? (
          <section className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                {profile.institution ?? "Academic portfolio"}
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
            title="Contact information is being prepared."
            description="Published contact details will appear here after an administrator completes the public profile."
          />
        )}
      </Container>
    </>
  );
}
