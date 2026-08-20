import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { requireAuth } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const admin = await requireAuth();

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
