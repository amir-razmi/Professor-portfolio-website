import assert from "node:assert/strict";
import test from "node:test";

import { ContentVisibility, PublicationType, ResearchItemStatus } from "@prisma/client";

import {
  selectPublications,
  selectPublicResearchItems,
} from "../../src/features/public-content/server/public-content-policy";

const oldDate = new Date("2025-01-01T00:00:00.000Z");
const recentDate = new Date("2026-01-01T00:00:00.000Z");

test("public research selection excludes drafts and private records", () => {
  const items = [
    {
      id: "private",
      isPublished: true,
      visibility: ContentVisibility.PRIVATE,
      sortOrder: 1,
      startDate: recentDate,
      publishedAt: recentDate,
      createdAt: recentDate,
    },
    {
      id: "draft",
      isPublished: false,
      visibility: ContentVisibility.PUBLIC,
      sortOrder: 1,
      startDate: recentDate,
      publishedAt: recentDate,
      createdAt: recentDate,
    },
    {
      id: "public-later",
      isPublished: true,
      visibility: ContentVisibility.PUBLIC,
      sortOrder: 20,
      startDate: oldDate,
      publishedAt: oldDate,
      createdAt: oldDate,
    },
    {
      id: "public-priority",
      isPublished: true,
      visibility: ContentVisibility.PUBLIC,
      sortOrder: 10,
      startDate: recentDate,
      publishedAt: recentDate,
      createdAt: recentDate,
    },
  ];

  const selected = selectPublicResearchItems(items);

  assert.deepEqual(
    selected.map((item) => item.id),
    ["public-priority", "public-later"],
  );
});

test("public publication selection prioritizes featured published records", () => {
  const publications = [
    {
      id: "draft-featured",
      isPublished: false,
      isFeatured: true,
      publicationDate: recentDate,
      publishedAt: recentDate,
      createdAt: recentDate,
    },
    {
      id: "published-recent",
      isPublished: true,
      isFeatured: false,
      publicationDate: recentDate,
      publishedAt: recentDate,
      createdAt: recentDate,
    },
    {
      id: "published-featured",
      isPublished: true,
      isFeatured: true,
      publicationDate: oldDate,
      publishedAt: oldDate,
      createdAt: oldDate,
    },
  ];

  const selected = selectPublications(publications, 2);

  assert.deepEqual(
    selected.map((publication) => publication.id),
    ["published-featured", "published-recent"],
  );
});

test("empty public collections remain empty", () => {
  assert.deepEqual(selectPublicResearchItems([]), []);
  assert.deepEqual(selectPublications([]), []);
});

test("public record helpers accept the persisted enum shapes", () => {
  const research = {
    isPublished: true,
    visibility: ContentVisibility.PUBLIC,
    sortOrder: 0,
    startDate: null,
    publishedAt: recentDate,
    createdAt: recentDate,
    status: ResearchItemStatus.ACTIVE,
  };
  const publication = {
    isPublished: true,
    isFeatured: false,
    publicationDate: recentDate,
    publishedAt: recentDate,
    createdAt: recentDate,
    publicationType: PublicationType.JOURNAL_ARTICLE,
  };

  assert.equal(selectPublicResearchItems([research]).length, 1);
  assert.equal(selectPublications([publication]).length, 1);
});
