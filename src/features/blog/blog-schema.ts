import { BlogPostStatus } from "@prisma/client";
import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const objectIdSchema = z.string().regex(objectIdPattern, "Enter a valid record id.");

export function normalizeBlogSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const slugSchema = z
  .string()
  .trim()
  .min(1, "Enter a slug.")
  .max(160, "Use 160 characters or fewer.")
  .transform(normalizeBlogSlug)
  .refine((value) => slugPattern.test(value), {
    message: "Use lowercase letters, numbers, and single hyphens only.",
  });

const optionalText = (maximumLength: number) =>
  z
    .union([z.string().trim().max(maximumLength), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

const optionalDate = z
  .union([z.date(), z.string().trim(), z.null(), z.undefined()])
  .transform((value, context) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid publication date.",
      });
      return z.NEVER;
    }

    return date;
  });

const uniqueIds = (values: string[]): string[] => [...new Set(values)];

const idListSchema = z
  .array(objectIdSchema)
  .max(20, "Select no more than 20 items.")
  .default([])
  .transform(uniqueIds);

const blogStatusSchema = z.enum([
  BlogPostStatus.DRAFT,
  BlogPostStatus.PUBLISHED,
  BlogPostStatus.ARCHIVED,
]);

export const blogPostSchema = z
  .object({
    id: z
      .union([objectIdSchema, z.null(), z.undefined()])
      .transform((value) => (typeof value === "string" ? value : null)),
    title: z.string().trim().min(3, "Title must contain at least 3 characters.").max(180),
    slug: slugSchema,
    excerpt: optionalText(500),
    content: z
      .string()
      .trim()
      .min(1, "Add the post content.")
      .max(100_000, "Use 100,000 characters or fewer."),
    status: blogStatusSchema,
    publishedAt: optionalDate,
    categoryIds: idListSchema,
    tagIds: idListSchema,
    isFeatured: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === BlogPostStatus.PUBLISHED && !value.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Published posts require a publication date.",
      });
    }
  });

export type BlogPostInput = z.output<typeof blogPostSchema>;

export function blogPostFormDataToInput(formData: FormData): unknown {
  const postId = formData.get("postId");
  const publishedAt = formData.get("publishedAt");

  return {
    id: typeof postId === "string" && postId.trim().length > 0 ? postId : null,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    status: formData.get("status") ?? BlogPostStatus.DRAFT,
    publishedAt:
      typeof publishedAt === "string" && publishedAt.trim().length > 0 ? publishedAt : null,
    categoryIds: formData
      .getAll("categoryIds")
      .filter((value): value is string => typeof value === "string"),
    tagIds: formData.getAll("tagIds").filter((value): value is string => typeof value === "string"),
    isFeatured: formData.get("isFeatured") === "on",
  };
}

const taxonomyNameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(80, "Use 80 characters or fewer.");

const taxonomySlugSchema = z
  .union([z.string().trim().max(120), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? normalizeBlogSlug(value) : ""));

export const blogCategorySchema = z
  .object({
    id: z
      .union([objectIdSchema, z.null(), z.undefined()])
      .transform((value) => (typeof value === "string" ? value : null)),
    name: taxonomyNameSchema,
    slug: taxonomySlugSchema,
    description: optionalText(240),
    isActive: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.slug || !slugPattern.test(value.slug)) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Use lowercase letters, numbers, and single hyphens only.",
      });
    }
  });

export type BlogCategoryInput = z.output<typeof blogCategorySchema>;

export const blogTagSchema = z
  .object({
    id: z
      .union([objectIdSchema, z.null(), z.undefined()])
      .transform((value) => (typeof value === "string" ? value : null)),
    name: taxonomyNameSchema,
    slug: taxonomySlugSchema,
    isActive: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.slug || !slugPattern.test(value.slug)) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Use lowercase letters, numbers, and single hyphens only.",
      });
    }
  });

export type BlogTagInput = z.output<typeof blogTagSchema>;

export function blogCategoryFormDataToInput(formData: FormData): unknown {
  const id = formData.get("id");

  return {
    id: typeof id === "string" && id.trim().length > 0 ? id : null,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
  };
}

export function blogTagFormDataToInput(formData: FormData): unknown {
  const id = formData.get("id");

  return {
    id: typeof id === "string" && id.trim().length > 0 ? id : null,
    name: formData.get("name"),
    slug: formData.get("slug"),
    isActive: formData.get("isActive") === "on",
  };
}

const optionalQueryText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, 100) : null,
  );

const queryPage = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? 1 : value),
  z.coerce.number().int().min(1).max(10_000),
);

const queryPageSize = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? 10 : value),
  z.coerce.number().int().min(1).max(24),
);

export const blogListQuerySchema = z
  .object({
    q: optionalQueryText,
    category: optionalQueryText,
    tag: optionalQueryText,
    status: z
      .union([blogStatusSchema, z.null(), z.undefined()])
      .transform((value) => value ?? null),
    page: queryPage,
    pageSize: queryPageSize,
  })
  .strict();

export type BlogListQuery = z.output<typeof blogListQuerySchema>;

export function normalizeBlogListQuery(
  input: Record<string, string | string[] | undefined> | URLSearchParams,
): BlogListQuery {
  const read = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) {
      return input.get(key) ?? undefined;
    }

    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const textValue = (key: string): string | null => {
    const parsed = optionalQueryText.safeParse(read(key));
    return parsed.success ? parsed.data : null;
  };
  const statusValue = blogStatusSchema.safeParse(read("status"));
  const pageValue = Number(read("page"));
  const pageSizeValue = Number(read("pageSize"));

  return {
    q: textValue("q"),
    category: textValue("category"),
    tag: textValue("tag"),
    status: statusValue.success ? statusValue.data : null,
    page: Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 10_000 ? pageValue : 1,
    pageSize:
      Number.isInteger(pageSizeValue) && pageSizeValue >= 1 && pageSizeValue <= 24
        ? pageSizeValue
        : 10,
  };
}
