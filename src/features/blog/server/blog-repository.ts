import "server-only";

import { AuditAction, BlogPostStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ContentValidationError } from "@/server/content/content-errors";
import { recordAuditLogInTransaction } from "@/server/audit/audit-service";

import type { BlogListQuery, BlogPostInput } from "../blog-schema";
import type {
  BlogPageResult,
  BlogPostRecord,
  BlogPostRepository,
  BlogTagRecord,
  BlogTaxonomyRecord,
} from "./blog-policy";

const blogPostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  status: true,
  publishedAt: true,
  isFeatured: true,
  authorId: true,
  categoryIds: true,
  tagIds: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      displayName: true,
    },
  },
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.BlogPostSelect;

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  postIds: true,
} satisfies Prisma.BlogCategorySelect;

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  postIds: true,
} satisfies Prisma.BlogTagSelect;

type BlogPostPayload = Prisma.BlogPostGetPayload<{ select: typeof blogPostSelect }>;
type CategoryPayload = Prisma.BlogCategoryGetPayload<{ select: typeof categorySelect }>;
type TagPayload = Prisma.BlogTagGetPayload<{ select: typeof tagSelect }>;

const objectIdPattern = /^[a-f\d]{24}$/i;

function isObjectId(value: string): boolean {
  return objectIdPattern.test(value);
}

function mapPost(post: BlogPostPayload): BlogPostRecord {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    publishedAt: post.publishedAt,
    isFeatured: post.isFeatured,
    authorId: post.authorId,
    authorName: post.author.displayName,
    categoryIds: post.categoryIds,
    tagIds: post.tagIds,
    categories: post.categories,
    tags: post.tags,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function mapCategory(category: CategoryPayload): BlogTaxonomyRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
    postCount: category.postIds.length,
  };
}

function mapTag(tag: TagPayload): BlogTagRecord {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    isActive: tag.isActive,
    postCount: tag.postIds.length,
  };
}

function duplicateSlugError(resource: "post" | "category" | "tag"): ContentValidationError {
  const label = resource === "post" ? "post" : resource;
  return new ContentValidationError(`A ${label} with this slug already exists.`, {
    slug: ["یک شناسه نشانی یکتا انتخاب کنید."],
  });
}

function mapKnownRequestError(error: unknown, resource: "post" | "category" | "tag"): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw duplicateSlugError(resource);
  }

  throw error;
}

function normalizePage(query: BlogListQuery): { page: number; pageSize: number; skip: number } {
  const pageSize = Math.min(Math.max(query.pageSize, 1), 24);
  const page = Math.max(query.page, 1);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

async function resolveFilterId(
  kind: "category" | "tag",
  slug: string | null,
  activeOnly: boolean,
): Promise<string | null | "missing"> {
  if (!slug) {
    return null;
  }

  const record =
    kind === "category"
      ? await prisma.blogCategory.findUnique({
          where: { slug },
          select: { id: true, isActive: true },
        })
      : await prisma.blogTag.findUnique({
          where: { slug },
          select: { id: true, isActive: true },
        });

  if (!record || (activeOnly && !record.isActive)) {
    return "missing";
  }

  return record.id;
}

function buildSearchWhere(query: BlogListQuery): Prisma.BlogPostWhereInput {
  if (!query.q) {
    return {};
  }

  return {
    OR: [
      {
        title: {
          contains: query.q,
          mode: "insensitive",
        },
      },
      {
        excerpt: {
          contains: query.q,
          mode: "insensitive",
        },
      },
    ],
  };
}

function buildAdminWhere(
  query: BlogListQuery,
  categoryId: string | null,
  tagId: string | null,
): Prisma.BlogPostWhereInput {
  return {
    ...buildSearchWhere(query),
    ...(query.status ? { status: query.status } : {}),
    ...(categoryId ? { categoryIds: { has: categoryId } } : {}),
    ...(tagId ? { tagIds: { has: tagId } } : {}),
  };
}

function buildPublicWhere(
  query: BlogListQuery,
  categoryId: string | null,
  tagId: string | null,
): Prisma.BlogPostWhereInput {
  return {
    ...buildSearchWhere(query),
    status: BlogPostStatus.PUBLISHED,
    publishedAt: { not: null },
    ...(categoryId ? { categoryIds: { has: categoryId } } : {}),
    ...(tagId ? { tagIds: { has: tagId } } : {}),
  };
}

async function findPosts(
  where: Prisma.BlogPostWhereInput,
  query: BlogListQuery,
  orderBy: Prisma.BlogPostOrderByWithRelationInput[],
): Promise<BlogPageResult> {
  const { page, pageSize, skip } = normalizePage(query);
  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: blogPostSelect,
    }),
  ]);

  return {
    items: posts.map(mapPost),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

async function syncCategoryPostIds(
  transaction: Prisma.TransactionClient,
  postId: string,
  previousIds: string[],
  nextIds: string[],
): Promise<void> {
  const affectedIds = [...new Set([...previousIds, ...nextIds])].filter(isObjectId);

  if (affectedIds.length === 0) {
    return;
  }

  const records = await transaction.blogCategory.findMany({
    where: { id: { in: affectedIds } },
    select: { id: true, postIds: true },
  });
  const selectedIds = new Set(nextIds);

  for (const record of records) {
    const postIds = new Set(record.postIds);

    if (selectedIds.has(record.id)) {
      postIds.add(postId);
    } else {
      postIds.delete(postId);
    }

    await transaction.blogCategory.update({
      where: { id: record.id },
      data: { postIds: [...postIds] },
    });
  }
}

async function syncTagPostIds(
  transaction: Prisma.TransactionClient,
  postId: string,
  previousIds: string[],
  nextIds: string[],
): Promise<void> {
  const affectedIds = [...new Set([...previousIds, ...nextIds])].filter(isObjectId);

  if (affectedIds.length === 0) {
    return;
  }

  const records = await transaction.blogTag.findMany({
    where: { id: { in: affectedIds } },
    select: { id: true, postIds: true },
  });
  const selectedIds = new Set(nextIds);

  for (const record of records) {
    const postIds = new Set(record.postIds);

    if (selectedIds.has(record.id)) {
      postIds.add(postId);
    } else {
      postIds.delete(postId);
    }

    await transaction.blogTag.update({
      where: { id: record.id },
      data: { postIds: [...postIds] },
    });
  }
}

async function assertActiveTaxonomy(
  transaction: Prisma.TransactionClient,
  input: BlogPostInput,
): Promise<void> {
  const [categories, tags] = await Promise.all([
    transaction.blogCategory.findMany({
      where: { id: { in: input.categoryIds }, isActive: true },
      select: { id: true },
    }),
    transaction.blogTag.findMany({
      where: { id: { in: input.tagIds }, isActive: true },
      select: { id: true },
    }),
  ]);

  if (categories.length !== input.categoryIds.length) {
    throw new ContentValidationError("Select only active blog categories.", {
      categoryIds: ["یک یا چند دسته‌بندی انتخاب‌شده در دسترس نیست."],
    });
  }

  if (tags.length !== input.tagIds.length) {
    throw new ContentValidationError("Select only active blog tags.", {
      tagIds: ["یک یا چند برچسب انتخاب‌شده در دسترس نیست."],
    });
  }
}

export const blogPostRepository: BlogPostRepository = {
  async findById(id) {
    if (!isObjectId(id)) {
      return null;
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: blogPostSelect,
    });

    return post ? mapPost(post) : null;
  },

  async findAdminPosts(query) {
    const [categoryId, tagId] = await Promise.all([
      resolveFilterId("category", query.category, false),
      resolveFilterId("tag", query.tag, false),
    ]);

    if (categoryId === "missing" || tagId === "missing") {
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: 0,
      };
    }

    return findPosts(buildAdminWhere(query, categoryId, tagId), query, [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ]);
  },

  async findPublicPosts(query) {
    const [categoryId, tagId] = await Promise.all([
      resolveFilterId("category", query.category, true),
      resolveFilterId("tag", query.tag, true),
    ]);

    if (categoryId === "missing" || tagId === "missing") {
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: 0,
      };
    }

    return findPosts(buildPublicWhere(query, categoryId, tagId), query, [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ]);
  },

  async findPublicBySlug(slug) {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: blogPostSelect,
    });

    return post ? mapPost(post) : null;
  },

  async findPublishedSlugs() {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: BlogPostStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      select: { slug: true },
      orderBy: { publishedAt: "desc" },
    });

    return posts.map((post) => post.slug);
  },

  async listCategories(options = {}) {
    const records = await prisma.blogCategory.findMany({
      where: options.activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
      select: categorySelect,
    });

    return records.map(mapCategory);
  },

  async listTags(options = {}) {
    const records = await prisma.blogTag.findMany({
      where: options.activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
      select: tagSelect,
    });

    return records.map(mapTag);
  },

  async savePost(input, actorId) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const existing = input.id
          ? await transaction.blogPost.findUnique({
              where: { id: input.id },
              select: { id: true, authorId: true, categoryIds: true, tagIds: true, status: true },
            })
          : null;

        if (input.id && !existing) {
          throw new ContentValidationError("The blog post could not be found.", {});
        }

        const duplicate = await transaction.blogPost.findFirst({
          where: {
            slug: input.slug,
            ...(input.id ? { id: { not: input.id } } : {}),
          },
          select: { id: true },
        });

        if (duplicate) {
          throw duplicateSlugError("post");
        }

        await assertActiveTaxonomy(transaction, input);

        const post = input.id
          ? await transaction.blogPost.update({
              where: { id: input.id },
              data: {
                title: input.title,
                slug: input.slug,
                excerpt: input.excerpt,
                content: input.content,
                status: input.status,
                publishedAt: input.publishedAt,
                isFeatured: input.isFeatured,
                categoryIds: input.categoryIds,
                tagIds: input.tagIds,
                updatedById: actorId,
              },
              select: blogPostSelect,
            })
          : await transaction.blogPost.create({
              data: {
                title: input.title,
                slug: input.slug,
                excerpt: input.excerpt,
                content: input.content,
                status: input.status,
                publishedAt: input.publishedAt,
                isFeatured: input.isFeatured,
                authorId: actorId,
                categoryIds: input.categoryIds,
                tagIds: input.tagIds,
                createdById: actorId,
                updatedById: actorId,
              },
              select: blogPostSelect,
            });

        await Promise.all([
          syncCategoryPostIds(transaction, post.id, existing?.categoryIds ?? [], input.categoryIds),
          syncTagPostIds(transaction, post.id, existing?.tagIds ?? [], input.tagIds),
        ]);

        const action = !existing
          ? AuditAction.CREATE
          : existing.status !== input.status && input.status === BlogPostStatus.PUBLISHED
            ? AuditAction.PUBLISH
            : existing.status === BlogPostStatus.PUBLISHED &&
                input.status !== BlogPostStatus.PUBLISHED
              ? AuditAction.UNPUBLISH
              : AuditAction.UPDATE;

        await recordAuditLogInTransaction(transaction, {
          action,
          targetResource: "BlogPost",
          targetId: post.id,
          summary: !existing
            ? "Blog post created."
            : action === AuditAction.PUBLISH
              ? "Blog post published."
              : action === AuditAction.UNPUBLISH
                ? "Blog post unpublished."
                : "Blog post updated.",
          actorId,
          metadata: {
            status: input.status,
            isFeatured: input.isFeatured,
          },
        });

        const saved = await transaction.blogPost.findUnique({
          where: { id: post.id },
          select: blogPostSelect,
        });

        if (!saved) {
          throw new ContentValidationError("The blog post could not be loaded after saving.", {});
        }

        return mapPost(saved);
      });
    } catch (error) {
      return mapKnownRequestError(error, "post");
    }
  },

  async setPublicationState(postId, status, publishedAt, actorId) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const existing = await transaction.blogPost.findUnique({
          where: { id: postId },
          select: { status: true },
        });

        if (!existing) {
          throw new ContentValidationError("The blog post could not be found.", {});
        }

        const post = await transaction.blogPost.update({
          where: { id: postId },
          data: {
            status,
            publishedAt,
            updatedById: actorId,
          },
          select: blogPostSelect,
        });

        await recordAuditLogInTransaction(transaction, {
          action: status === BlogPostStatus.PUBLISHED ? AuditAction.PUBLISH : AuditAction.UNPUBLISH,
          targetResource: "BlogPost",
          targetId: postId,
          summary:
            status === BlogPostStatus.PUBLISHED ? "Blog post published." : "Blog post unpublished.",
          actorId,
          metadata: { status },
        });

        return mapPost(post);
      });
    } catch (error) {
      return mapKnownRequestError(error, "post");
    }
  },

  async deletePost(postId, actorId) {
    await prisma.$transaction(async (transaction) => {
      const existing = await transaction.blogPost.findUnique({
        where: { id: postId },
        select: { id: true, categoryIds: true, tagIds: true },
      });

      if (!existing) {
        throw new ContentValidationError("The blog post could not be found.", {});
      }

      await Promise.all([
        syncCategoryPostIds(transaction, postId, existing.categoryIds, []),
        syncTagPostIds(transaction, postId, existing.tagIds, []),
      ]);
      await transaction.blogPost.delete({ where: { id: postId } });
      await recordAuditLogInTransaction(transaction, {
        action: AuditAction.DELETE,
        targetResource: "BlogPost",
        targetId: postId,
        summary: "Blog post deleted.",
        actorId,
      });
    });
  },

  async saveCategory(input, actorId) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.blogCategory.findFirst({
          where: {
            OR: [{ slug: input.slug }, { name: { equals: input.name, mode: "insensitive" } }],
            ...(input.id ? { id: { not: input.id } } : {}),
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new ContentValidationError("A category with this name or slug already exists.", {
            name: ["Choose a unique category name."],
            slug: ["Choose a unique category slug."],
          });
        }

        const category = input.id
          ? await transaction.blogCategory.update({
              where: { id: input.id },
              data: {
                name: input.name,
                slug: input.slug,
                description: input.description,
                isActive: input.isActive,
                updatedById: actorId,
              },
              select: categorySelect,
            })
          : await transaction.blogCategory.create({
              data: {
                name: input.name,
                slug: input.slug,
                description: input.description,
                isActive: input.isActive,
                postIds: [],
                createdById: actorId,
                updatedById: actorId,
              },
              select: categorySelect,
            });

        await recordAuditLogInTransaction(transaction, {
          action: input.id ? AuditAction.UPDATE : AuditAction.CREATE,
          targetResource: "BlogCategory",
          targetId: category.id,
          summary: input.id ? "Blog category updated." : "Blog category created.",
          actorId,
        });

        return mapCategory(category);
      });
    } catch (error) {
      return mapKnownRequestError(error, "category");
    }
  },

  async saveTag(input, actorId) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.blogTag.findFirst({
          where: {
            OR: [{ slug: input.slug }, { name: { equals: input.name, mode: "insensitive" } }],
            ...(input.id ? { id: { not: input.id } } : {}),
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new ContentValidationError("A tag with this name or slug already exists.", {
            name: ["Choose a unique tag name."],
            slug: ["Choose a unique tag slug."],
          });
        }

        const tag = input.id
          ? await transaction.blogTag.update({
              where: { id: input.id },
              data: {
                name: input.name,
                slug: input.slug,
                isActive: input.isActive,
                updatedById: actorId,
              },
              select: tagSelect,
            })
          : await transaction.blogTag.create({
              data: {
                name: input.name,
                slug: input.slug,
                isActive: input.isActive,
                postIds: [],
                createdById: actorId,
                updatedById: actorId,
              },
              select: tagSelect,
            });

        await recordAuditLogInTransaction(transaction, {
          action: input.id ? AuditAction.UPDATE : AuditAction.CREATE,
          targetResource: "BlogTag",
          targetId: tag.id,
          summary: input.id ? "Blog tag updated." : "Blog tag created.",
          actorId,
        });

        return mapTag(tag);
      });
    } catch (error) {
      return mapKnownRequestError(error, "tag");
    }
  },

  async deleteCategory(id, actorId) {
    await prisma.$transaction(async (transaction) => {
      const category = await transaction.blogCategory.findUnique({
        where: { id },
        select: { id: true, postIds: true },
      });

      if (!category) {
        throw new ContentValidationError("The blog category could not be found.", {});
      }

      if (category.postIds.length > 0) {
        throw new ContentValidationError(
          "This category is still assigned to blog posts. Deactivate it instead.",
          { id: ["Remove the category from its posts before deleting it."] },
        );
      }

      await transaction.blogCategory.delete({ where: { id } });
      await recordAuditLogInTransaction(transaction, {
        action: AuditAction.DELETE,
        targetResource: "BlogCategory",
        targetId: id,
        summary: "Blog category deleted.",
        actorId,
      });
    });
  },

  async deleteTag(id, actorId) {
    await prisma.$transaction(async (transaction) => {
      const tag = await transaction.blogTag.findUnique({
        where: { id },
        select: { id: true, postIds: true },
      });

      if (!tag) {
        throw new ContentValidationError("The blog tag could not be found.", {});
      }

      if (tag.postIds.length > 0) {
        throw new ContentValidationError(
          "This tag is still assigned to blog posts. Deactivate it instead.",
          { id: ["Remove the tag from its posts before deleting it."] },
        );
      }

      await transaction.blogTag.delete({ where: { id } });
      await recordAuditLogInTransaction(transaction, {
        action: AuditAction.DELETE,
        targetResource: "BlogTag",
        targetId: id,
        summary: "Blog tag deleted.",
        actorId,
      });
    });
  },
};
