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

import {
  findPublishedPublications,
  findPublishedResearchItems,
  type PublicPublication,
  type PublicResearchItem,
} from "./public-content-repository";

export type PublicPortfolioContent = {
  profile: ProfessorProfileRecord | null;
  settings: SiteSettingsRecord | null;
};

export type PublicAcademicContent = PublicPortfolioContent & {
  researchItems: PublicResearchItem[];
  publications: PublicPublication[];
};

export const getCachedPublicSiteSettings = cache(async (): Promise<SiteSettingsRecord | null> =>
  getPublicSiteSettings(),
);

export const getCachedPublishedProfessorProfile = cache(
  async (): Promise<ProfessorProfileRecord | null> => getPublishedProfessorProfile(),
);

export const getPublicPortfolioContent = cache(async (): Promise<PublicPortfolioContent> => {
  const [profile, settings] = await Promise.all([
    getCachedPublishedProfessorProfile(),
    getCachedPublicSiteSettings(),
  ]);

  return { profile, settings };
});

export const getPublicAcademicContent = cache(async (): Promise<PublicAcademicContent> => {
  const [portfolio, researchItems, publications] = await Promise.all([
    getPublicPortfolioContent(),
    findPublishedResearchItems(),
    findPublishedPublications(),
  ]);

  return { ...portfolio, researchItems, publications };
});

export const getSelectedPublicAcademicContent = cache(async (): Promise<PublicAcademicContent> => {
  const [portfolio, researchItems, publications] = await Promise.all([
    getPublicPortfolioContent(),
    findPublishedResearchItems(3),
    findPublishedPublications(4),
  ]);

  return { ...portfolio, researchItems, publications };
});

export type { PublicPublication, PublicResearchItem };
