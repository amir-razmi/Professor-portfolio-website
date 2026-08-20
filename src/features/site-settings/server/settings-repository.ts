import "server-only";

import { AuditAction, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { SiteSettingsRecord, SiteSettingsRepository } from "./settings-policy";

const settingsSelect = {
  id: true,
  siteName: true,
  siteDescription: true,
  contactEmail: true,
  defaultLocale: true,
  timezone: true,
  maintenanceMode: true,
  footerText: true,
  defaultOgImageUrl: true,
  updatedAt: true,
} satisfies Prisma.SiteSettingsSelect;

export const siteSettingsRepository: SiteSettingsRepository = {
  findDefault() {
    return prisma.siteSettings.findUnique({
      where: { key: "default" },
      select: settingsSelect,
    }) as Promise<SiteSettingsRecord | null>;
  },
  saveDefault(input, actorId) {
    return prisma.$transaction(async (transaction) => {
      const existing = await transaction.siteSettings.findUnique({
        where: { key: "default" },
        select: { id: true },
      });
      const settings = await transaction.siteSettings.upsert({
        where: { key: "default" },
        update: {
          ...input,
          updatedById: actorId,
        },
        create: {
          key: "default",
          ...input,
          createdById: actorId,
          updatedById: actorId,
        },
        select: settingsSelect,
      });

      await transaction.auditLog.create({
        data: {
          action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
          targetResource: "SiteSettings",
          targetId: settings.id,
          summary: existing ? "Site settings updated." : "Site settings created.",
          actorId,
        },
      });

      return settings;
    }) as Promise<SiteSettingsRecord>;
  },
};
