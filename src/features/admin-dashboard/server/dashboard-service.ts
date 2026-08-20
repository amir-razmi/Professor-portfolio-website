import "server-only";

import { requireAuth } from "@/server/auth/authorization";

import {
  getDashboardProfileSummary,
  getDashboardSettingsSummary,
  type DashboardProfileSummary,
  type DashboardSettingsSummary,
} from "./dashboard-repository";

export type DashboardSummary = {
  admin: Awaited<ReturnType<typeof requireAuth>>;
  profile: DashboardProfileSummary;
  settings: DashboardSettingsSummary;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const admin = await requireAuth();
  const [profile, settings] = await Promise.all([
    getDashboardProfileSummary(),
    getDashboardSettingsSummary(),
  ]);

  return { admin, profile, settings };
}
