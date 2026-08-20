import "server-only";

import { cache } from "react";

import {
  getPublishedProfessorProfile,
  type ProfessorProfileRecord,
} from "@/features/professor-profile/server/profile-service";
import {
  getPublicSiteSettings,
  type SiteSettingsRecord,
} from "@/features/site-settings/server/settings-service";

export type PublicPortfolioContent = {
  profile: ProfessorProfileRecord | null;
  settings: SiteSettingsRecord | null;
};

export const getCachedPublicSiteSettings = cache(async (): Promise<SiteSettingsRecord | null> =>
  getPublicSiteSettings(),
);

export const getPublicPortfolioContent = cache(async (): Promise<PublicPortfolioContent> => {
  const [profile, settings] = await Promise.all([
    getPublishedProfessorProfile(),
    getCachedPublicSiteSettings(),
  ]);

  return { profile, settings };
});
