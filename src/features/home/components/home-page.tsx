import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

const foundationAreas = [
  {
    title: "Research",
    description: "A structured space for research themes, publications, and scholarly projects.",
    href: "#research",
  },
  {
    title: "Teaching",
    description: "A clear home for courses, teaching materials, and learning resources.",
    href: "#teaching",
  },
  {
    title: "Contact",
    description: "A focused destination for professional contact details and academic links.",
    href: "#contact",
  },
] as const;

export default function HomeFeaturePage() {
  return (
    <>
      <section
        id="overview"
        className="relative overflow-hidden border-b border-line bg-slate-950 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(154,91,50,0.35),transparent_42%)]" />
        <Container className="relative grid gap-12 py-20 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-orange-200">
              Academic portfolio foundation
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Present scholarly work with clarity and purpose.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              This initial shell creates a calm, accessible home for research, teaching, and
              academic communication. Content and data services can be added without changing the
              public structure.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="#research"
                className="rounded-full bg-orange-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Explore the foundation
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
              >
                Admin placeholder
              </Link>
            </div>
          </div>

          <Surface className="border-white/10 bg-white/10 text-white backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Foundation principles
            </p>
            <ul className="mt-6 space-y-5 text-sm leading-6 text-slate-300">
              <li className="border-l border-orange-200/60 pl-4">
                Server-rendered by default for a fast, dependable public experience.
              </li>
              <li className="border-l border-orange-200/60 pl-4">
                Feature-oriented boundaries ready for future academic content modules.
              </li>
              <li className="border-l border-orange-200/60 pl-4">
                Data and environment concerns kept on the server.
              </li>
            </ul>
          </Surface>
        </Container>
      </section>

      <section className="py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="A small, reusable UI foundation"
            title="A deliberate starting point for the academic site."
            description="The public shell is intentionally simple. Each section can become a feature without coupling presentation to database or administration concerns."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {foundationAreas.map((area) => (
              <Surface key={area.title} className="flex h-full flex-col">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                  {area.title}
                </p>
                <p className="mt-4 flex-1 leading-7 text-muted">{area.description}</p>
                <Link
                  href={area.href}
                  className="mt-7 inline-flex text-sm font-semibold text-foreground underline decoration-accent/50 underline-offset-4 transition hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  View section
                </Link>
              </Surface>
            ))}
          </div>
        </Container>
      </section>

      <section id="research" className="scroll-mt-24 border-y border-line bg-white py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeading
            eyebrow="Research"
            title="Make scholarly work easy to discover."
            description="This section is ready for research themes, publications, projects, and external scholarly links when those data features are introduced."
          />
          <Surface className="bg-slate-50">
            <p className="text-sm font-semibold text-foreground">
              Ready for the next feature stage
            </p>
            <p className="mt-3 leading-7 text-muted">
              The foundation keeps content presentation separate from server-side business logic, so
              future research records can be validated and queried without turning the page into a
              client component.
            </p>
          </Surface>
        </Container>
      </section>

      <section id="teaching" className="scroll-mt-24 py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <Surface className="order-2 bg-slate-950 text-white lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">
              Teaching workspace
            </p>
            <p className="mt-4 leading-7 text-slate-300">
              A future teaching feature can add course pages, syllabi, and resources while this
              shell remains the stable public frame.
            </p>
          </Surface>
          <SectionHeading
            eyebrow="Teaching"
            title="Give learners a clear path through the material."
            description="The responsive layout and reusable surfaces are ready for course-oriented content without introducing client-side state prematurely."
            className="order-1 lg:order-2"
          />
        </Container>
      </section>

      <section id="contact" className="scroll-mt-24 border-t border-line bg-white py-20 lg:py-24">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Contact"
            title="A professional point of connection."
            description="Contact details and academic profiles will be sourced from validated server-side data in a later stage. For now, the section establishes the intended information hierarchy."
          />
        </Container>
      </section>
    </>
  );
}
