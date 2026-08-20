import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { requireAuth } from "@/server/auth/session";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const admin = await requireAuth();

  return (
    <Container className="py-16 lg:py-24">
      <SectionHeading
        eyebrow="Administration"
        title="Administrator access is working."
        description="This protected test page verifies the server-side authentication boundary before editorial workflows are added."
      />
      <Surface className="mt-10 max-w-2xl bg-white">
        <p className="text-sm font-semibold text-foreground">Signed in as {admin.displayName}</p>
        <p className="mt-3 leading-7 text-muted">
          The current administrator session is valid for {admin.email}. Role-specific permissions
          will be introduced in a later stage.
        </p>
      </Surface>
    </Container>
  );
}
