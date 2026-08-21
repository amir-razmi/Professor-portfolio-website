import "server-only";

import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { recordAuditLogInTransaction } from "@/server/audit/audit-service";

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

      await recordAuditLogInTransaction(transaction, {
        action: existing ? "UPDATE" : "CREATE",
        targetResource: "SiteSettings",
        targetId: settings.id,
        summary: existing ? "تنظیمات سایت به‌روزرسانی شد." : "تنظیمات سایت ایجاد شد.",
        actorId,
      });

      return settings;
    }) as Promise<SiteSettingsRecord>;
  },
};
