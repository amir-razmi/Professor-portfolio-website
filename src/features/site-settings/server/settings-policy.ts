import { assertPermission } from "@/server/auth/access-control";
import { Permission, type AuthorizationPrincipal } from "@/server/auth/permissions";
import { ContentValidationError } from "@/server/content/content-errors";

import { siteSettingsSchema, type SiteSettingsInput } from "../settings-schema";

export type SiteSettingsRecord = SiteSettingsInput & {
  id: string;
  updatedAt: Date;
};

export type SiteSettingsRepository = {
  findDefault: () => Promise<SiteSettingsRecord | null>;
  saveDefault: (input: SiteSettingsInput, actorId: string) => Promise<SiteSettingsRecord>;
};

export async function getSiteSettingsForActor(
  actor: AuthorizationPrincipal | null,
  repository: SiteSettingsRepository,
): Promise<SiteSettingsRecord | null> {
  assertPermission(actor, Permission.MANAGE_SITE_SETTINGS);
  return repository.findDefault();
}

export async function updateSiteSettingsForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  repository: SiteSettingsRepository,
): Promise<SiteSettingsRecord> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_SITE_SETTINGS);
  const parsed = siteSettingsSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContentValidationError(
      "Review the highlighted site settings.",
      parsed.error.flatten().fieldErrors,
    );
  }

  return repository.saveDefault(parsed.data, authorizedActor.id);
}
