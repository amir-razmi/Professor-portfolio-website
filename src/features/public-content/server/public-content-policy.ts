import { ContentVisibility } from "@prisma/client";

export type PublicResearchItemLike = {
  isPublished: boolean;
  visibility: ContentVisibility;
  sortOrder: number;
  startDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export type PublicPublicationLike = {
  isPublished: boolean;
  isFeatured: boolean;
  publicationDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export function isPublicResearchItem(item: PublicResearchItemLike): boolean {
  return item.isPublished && item.visibility === ContentVisibility.PUBLIC;
}

export function isPublicPublication(item: PublicPublicationLike): boolean {
  return item.isPublished;
}

function timestamp(date: Date | null): number {
  return date?.getTime() ?? 0;
}

export function selectPublicResearchItems<T extends PublicResearchItemLike>(
  items: readonly T[],
  limit?: number,
): T[] {
  const visibleItems = items.filter(isPublicResearchItem).toSorted((left, right) => {
    const orderDifference = left.sortOrder - right.sortOrder;

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return (
      timestamp(right.startDate ?? right.publishedAt ?? right.createdAt) -
      timestamp(left.startDate ?? left.publishedAt ?? left.createdAt)
    );
  });

  return typeof limit === "number" && limit > 0
    ? visibleItems.slice(0, Math.floor(limit))
    : visibleItems;
}

export function selectPublications<T extends PublicPublicationLike>(
  items: readonly T[],
  limit?: number,
): T[] {
  const visibleItems = items.filter(isPublicPublication).toSorted((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    return (
      timestamp(right.publicationDate ?? right.publishedAt ?? right.createdAt) -
      timestamp(left.publicationDate ?? left.publishedAt ?? left.createdAt)
    );
  });

  return typeof limit === "number" && limit > 0
    ? visibleItems.slice(0, Math.floor(limit))
    : visibleItems;
}
