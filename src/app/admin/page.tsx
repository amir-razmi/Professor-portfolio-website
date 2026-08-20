import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import { getAuthorizationSummary, requireAuth } from "@/server/auth/authorization";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const admin = await requireAuth();
  const authorization = getAuthorizationSummary(admin);

  return (
    <Container className="py-16 lg:py-24">
      <SectionHeading
        eyebrow="Administration"
        title="Authentication and role access are active."
        description="This protected test page verifies the centralized server-side authorization boundary before editorial workflows are added."
      />
      <Surface className="mt-10 max-w-2xl bg-white">
        <p className="text-sm font-semibold text-foreground">Signed in as {admin.displayName}</p>
        <p className="mt-3 leading-7 text-muted">
          The current administrator session is valid for {admin.email} with the {admin.role} role
          and {authorization.permissions.length} centrally assigned permissions.
        </p>
      </Surface>
    </Container>
  );
}
