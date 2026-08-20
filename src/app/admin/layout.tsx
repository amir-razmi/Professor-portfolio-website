import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { requireAuth } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAuth();

  return <AdminShell>{children}</AdminShell>;
}
