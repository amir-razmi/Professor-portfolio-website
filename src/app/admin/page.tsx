import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <Container className="py-16 lg:py-24">
      <SectionHeading
        eyebrow="Administration"
        title="The editorial workspace will live here."
        description="Authentication, CRUD workflows, and content management are intentionally deferred to a later stage."
      />
      <Surface className="mt-10 max-w-2xl bg-white">
        <p className="text-sm font-semibold text-foreground">Foundation placeholder</p>
        <p className="mt-3 leading-7 text-muted">
          This route establishes the admin layout boundary without implying that the area is
          protected yet.
        </p>
      </Surface>
    </Container>
  );
}
