import type { BlogPostStatus } from "@prisma/client";

/**
 * Client-safe blog status values. Keeping these literals separate from the
 * Prisma runtime prevents client components from bundling the generated
 * database client just to render a status select or badge.
 */
export const BLOG_POST_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const satisfies Record<"DRAFT" | "PUBLISHED" | "ARCHIVED", BlogPostStatus>;

export type BlogPostStatusValue = (typeof BLOG_POST_STATUS)[keyof typeof BLOG_POST_STATUS];

export function dateToDateTimeLocal(date: Date | null): string {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}
