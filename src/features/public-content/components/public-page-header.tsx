import { Container } from "@/components/ui/container";

export function PublicPageHeader({
  description,
  eyebrow,
  title,
}: Readonly<{
  description: string;
  eyebrow: string;
  title: string;
}>) {
  return (
    <header className="border-b border-line bg-white">
      <Container className="py-16 sm:py-20 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </Container>
    </header>
  );
}
