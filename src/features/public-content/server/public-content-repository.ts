import "server-only";

import { ContentVisibility, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { selectPublications, selectPublicResearchItems } from "./public-content-policy";

const researchItemSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  description: true,
  externalUrl: true,
  status: true,
  visibility: true,
  sortOrder: true,
  startDate: true,
  endDate: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
} satisfies Prisma.ResearchItemSelect;

const publicationSelect = {
  id: true,
  title: true,
  slug: true,
  citation: true,
  abstract: true,
  authors: true,
  venue: true,
  publicationType: true,
  doi: true,
  url: true,
  pdfUrl: true,
  publicationDate: true,
  isPublished: true,
  publishedAt: true,
  isFeatured: true,
  createdAt: true,
} satisfies Prisma.PublicationSelect;

export type PublicResearchItem = Prisma.ResearchItemGetPayload<{
  select: typeof researchItemSelect;
}>;

export type PublicPublication = Prisma.PublicationGetPayload<{
  select: typeof publicationSelect;
}>;

function takeOption(limit?: number): { take?: number } {
  return typeof limit === "number" && limit > 0 ? { take: Math.floor(limit) } : {};
}

export async function findPublishedResearchItems(limit?: number): Promise<PublicResearchItem[]> {
  const records = await prisma.researchItem.findMany({
    where: {
      isPublished: true,
      visibility: ContentVisibility.PUBLIC,
    },
    orderBy: [
      { sortOrder: "asc" },
      { startDate: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    ...takeOption(limit),
    select: researchItemSelect,
  });

  return selectPublicResearchItems(records, limit);
}

export async function findPublishedPublications(limit?: number): Promise<PublicPublication[]> {
  const records = await prisma.publication.findMany({
    where: {
      isPublished: true,
    },
    orderBy: [
      { isFeatured: "desc" },
      { publicationDate: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    ...takeOption(limit),
    select: publicationSelect,
  });

  return selectPublications(records, limit);
}
