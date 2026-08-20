import { redirect } from "next/navigation";

import { requireAuth } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  await requireAuth();
  redirect("/admin/dashboard");
}
