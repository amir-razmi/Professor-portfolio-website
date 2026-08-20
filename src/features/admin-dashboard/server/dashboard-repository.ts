import "server-only";

import { prisma } from "@/lib/prisma";

export type DashboardProfileSummary = {
  exists: boolean;
  isPublished: boolean;
  updatedAt: Date | null;
};

export type DashboardSettingsSummary = {
  exists: boolean;
  siteName: string | null;
  timezone: string;
  maintenanceMode: boolean;
  updatedAt: Date | null;
};

export async function getDashboardProfileSummary(): Promise<DashboardProfileSummary> {
  const profile = await prisma.professorProfile.findUnique({
    where: { key: "default" },
    select: {
      isPublished: true,
      updatedAt: true,
    },
  });

  return {
    exists: Boolean(profile),
    isPublished: profile?.isPublished ?? false,
    updatedAt: profile?.updatedAt ?? null,
  };
}

export async function getDashboardSettingsSummary(): Promise<DashboardSettingsSummary> {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
    select: {
      siteName: true,
      timezone: true,
      maintenanceMode: true,
      updatedAt: true,
    },
  });

  return {
    exists: Boolean(settings),
    siteName: settings?.siteName ?? null,
    timezone: settings?.timezone ?? "UTC",
    maintenanceMode: settings?.maintenanceMode ?? false,
    updatedAt: settings?.updatedAt ?? null,
  };
}
