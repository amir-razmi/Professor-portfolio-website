import "server-only";

import type { AuthorizationPrincipal } from "@/server/auth/permissions";

import {
  getSiteSettingsForActor,
  updateSiteSettingsForActor,
  type SiteSettingsRecord,
} from "./settings-policy";
import { siteSettingsRepository } from "./settings-repository";

export function getSiteSettingsForAdmin(
  actor: AuthorizationPrincipal,
): Promise<SiteSettingsRecord | null> {
  return getSiteSettingsForActor(actor, siteSettingsRepository);
}

export function updateSiteSettingsAs(
  actor: AuthorizationPrincipal,
  input: unknown,
): Promise<SiteSettingsRecord> {
  return updateSiteSettingsForActor(actor, input, siteSettingsRepository);
}

export function getPublicSiteSettings(): Promise<SiteSettingsRecord | null> {
  return siteSettingsRepository.findDefault();
}

export type { SiteSettingsRecord };
