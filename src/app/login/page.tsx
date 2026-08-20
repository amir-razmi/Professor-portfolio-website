import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Administrator sign in",
  description: "Sign in to the academic portfolio administration workspace.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-16 lg:py-24">
      <Container className="max-w-lg">
        <Surface className="bg-white p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Administration
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Sign in to continue
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Use an administrator account provisioned by the site owner.
          </p>
          <LoginForm />
        </Surface>
      </Container>
    </main>
  );
}
