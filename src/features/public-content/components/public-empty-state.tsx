import { Surface } from "@/components/ui/surface";

export function PublicEmptyState({
  description,
  headingLevel = "h2",
  title,
}: Readonly<{
  description: string;
  headingLevel?: "h2" | "h3";
  title: string;
}>) {
  const Heading = headingLevel;

  return (
    <Surface className="bg-white">
      <Heading className="text-xl font-semibold tracking-tight text-slate-950">{title}</Heading>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
    </Surface>
  );
}
