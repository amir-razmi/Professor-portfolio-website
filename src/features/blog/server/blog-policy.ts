import { BlogPostStatus } from "@prisma/client";

import { assertPermission } from "@/server/auth/access-control";
import { ForbiddenError } from "@/server/auth/authorization-error";
import { Permission, hasPermission, type AuthorizationPrincipal } from "@/server/auth/permissions";
import { ContentValidationError } from "@/server/content/content-errors";

import {
  blogCategorySchema,
  blogPostSchema,
  blogTagSchema,
  objectIdSchema,
  type BlogCategoryInput,
  type BlogListQuery,
  type BlogPostInput,
  type BlogTagInput,
} from "../blog-schema";

export type BlogTaxonomyRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  postCount: number;
};

export type BlogTagRecord = Omit<BlogTaxonomyRecord, "description"> & {
  description?: never;
};

export type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: BlogPostStatus;
  publishedAt: Date | null;
  isFeatured: boolean;
  authorId: string;
  authorName: string;
  categoryIds: string[];
  tagIds: string[];
  categories: Array<Pick<BlogTaxonomyRecord, "id" | "name" | "slug">>;
  tags: Array<Pick<BlogTaxonomyRecord, "id" | "name" | "slug">>;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPageResult = {
  items: BlogPostRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlogPostRepository = {
  findById: (id: string) => Promise<BlogPostRecord | null>;
  findAdminPosts: (query: BlogListQuery) => Promise<BlogPageResult>;
  findPublicPosts: (query: BlogListQuery) => Promise<BlogPageResult>;
  findPublicBySlug: (slug: string) => Promise<BlogPostRecord | null>;
  findPublishedSlugs: () => Promise<string[]>;
  listCategories: (options?: { activeOnly?: boolean }) => Promise<BlogTaxonomyRecord[]>;
  listTags: (options?: { activeOnly?: boolean }) => Promise<BlogTagRecord[]>;
  savePost: (input: BlogPostInput, actorId: string) => Promise<BlogPostRecord>;
  setPublicationState: (
    postId: string,
    status: BlogPostStatus,
    publishedAt: Date | null,
    actorId: string,
  ) => Promise<BlogPostRecord>;
  deletePost: (postId: string, actorId: string) => Promise<void>;
  saveCategory: (input: BlogCategoryInput, actorId: string) => Promise<BlogTaxonomyRecord>;
  saveTag: (input: BlogTagInput, actorId: string) => Promise<BlogTagRecord>;
  deleteCategory: (id: string, actorId: string) => Promise<void>;
  deleteTag: (id: string, actorId: string) => Promise<void>;
};

function validationError(message: string, fieldErrors: Record<string, string[]> = {}): never {
  throw new ContentValidationError(message, fieldErrors);
}

function parseObjectId(value: unknown, fieldName: string): string {
  const parsed = objectIdSchema.safeParse(value);

  if (!parsed.success) {
    validationError("The requested blog record is invalid.", {
      [fieldName]: ["Enter a valid record id."],
    });
  }

  return parsed.data;
}

function parseBlogPostInput(input: unknown): BlogPostInput {
  const parsed = blogPostSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContentValidationError(
      "Review the highlighted blog post fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  return parsed.data;
}

function parseCategoryInput(input: unknown): BlogCategoryInput {
  const parsed = blogCategorySchema.safeParse(input);

  if (!parsed.success) {
    throw new ContentValidationError(
      "Review the highlighted category fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  return parsed.data;
}

function parseTagInput(input: unknown): BlogTagInput {
  const parsed = blogTagSchema.safeParse(input);

  if (!parsed.success) {
    throw new ContentValidationError(
      "Review the highlighted tag fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  return parsed.data;
}

function assertExistingPost(
  post: BlogPostRecord | null,
  message = "The blog post could not be found.",
): BlogPostRecord {
  if (!post) {
    validationError(message);
  }

  return post;
}

export async function getAdminBlogPostsForActor(
  actor: AuthorizationPrincipal | null,
  query: BlogListQuery,
  repository: BlogPostRepository,
): Promise<BlogPageResult> {
  assertPermission(actor, Permission.MANAGE_BLOG_POSTS);
  return repository.findAdminPosts(query);
}

export async function getAdminBlogPostForActor(
  actor: AuthorizationPrincipal | null,
  postId: string,
  repository: BlogPostRepository,
): Promise<BlogPostRecord | null> {
  assertPermission(actor, Permission.MANAGE_BLOG_POSTS);
  const id = parseObjectId(postId, "postId");
  return repository.findById(id);
}

export async function saveBlogPostForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  repository: BlogPostRepository,
): Promise<BlogPostRecord> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_POSTS);
  const parsed = parseBlogPostInput(input);
  const existing = parsed.id ? await repository.findById(parsed.id) : null;

  if (parsed.id) {
    assertExistingPost(existing);
  }

  const currentStatus = existing?.status ?? null;
  const changesPublicationState = existing
    ? currentStatus !== parsed.status
    : parsed.status !== BlogPostStatus.DRAFT;
  const isPublishing = parsed.status === BlogPostStatus.PUBLISHED;
  const canPublish = hasPermission(authorizedActor, Permission.PUBLISH_BLOG_POSTS);

  if (
    !canPublish &&
    (changesPublicationState || (isPublishing && currentStatus !== BlogPostStatus.PUBLISHED))
  ) {
    throw new ForbiddenError();
  }

  const normalizedInput: BlogPostInput = {
    ...parsed,
    isFeatured: canPublish ? parsed.isFeatured : (existing?.isFeatured ?? false),
    publishedAt:
      parsed.status === BlogPostStatus.PUBLISHED
        ? canPublish
          ? parsed.publishedAt
          : (existing?.publishedAt ?? parsed.publishedAt)
        : null,
  };

  return repository.savePost(normalizedInput, authorizedActor.id);
}

export async function publishBlogPostForActor(
  actor: AuthorizationPrincipal | null,
  postId: string,
  repository: BlogPostRepository,
): Promise<BlogPostRecord> {
  const authorizedActor = assertPermission(actor, Permission.PUBLISH_BLOG_POSTS);
  const id = parseObjectId(postId, "postId");
  const existing = assertExistingPost(await repository.findById(id));

  return repository.setPublicationState(
    existing.id,
    BlogPostStatus.PUBLISHED,
    existing.publishedAt ?? new Date(),
    authorizedActor.id,
  );
}

export async function unpublishBlogPostForActor(
  actor: AuthorizationPrincipal | null,
  postId: string,
  repository: BlogPostRepository,
): Promise<BlogPostRecord> {
  const authorizedActor = assertPermission(actor, Permission.PUBLISH_BLOG_POSTS);
  const id = parseObjectId(postId, "postId");
  const existing = assertExistingPost(await repository.findById(id));

  return repository.setPublicationState(
    existing.id,
    BlogPostStatus.DRAFT,
    null,
    authorizedActor.id,
  );
}

export async function deleteBlogPostForActor(
  actor: AuthorizationPrincipal | null,
  postId: string,
  repository: BlogPostRepository,
): Promise<void> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_POSTS);
  const id = parseObjectId(postId, "postId");
  assertExistingPost(await repository.findById(id));
  await repository.deletePost(id, authorizedActor.id);
}

export async function getBlogTaxonomyForActor(
  actor: AuthorizationPrincipal | null,
  repository: BlogPostRepository,
): Promise<{ categories: BlogTaxonomyRecord[]; tags: BlogTagRecord[] }> {
  assertPermission(actor, Permission.MANAGE_BLOG_POSTS);
  const [categories, tags] = await Promise.all([
    repository.listCategories(),
    repository.listTags(),
  ]);

  return { categories, tags };
}

export async function saveBlogCategoryForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  repository: BlogPostRepository,
): Promise<BlogTaxonomyRecord> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_TAXONOMY);
  return repository.saveCategory(parseCategoryInput(input), authorizedActor.id);
}

export async function saveBlogTagForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  repository: BlogPostRepository,
): Promise<BlogTagRecord> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_TAXONOMY);
  return repository.saveTag(parseTagInput(input), authorizedActor.id);
}

export async function deleteBlogCategoryForActor(
  actor: AuthorizationPrincipal | null,
  id: string,
  repository: BlogPostRepository,
): Promise<void> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_TAXONOMY);
  await repository.deleteCategory(parseObjectId(id, "categoryId"), authorizedActor.id);
}

export async function deleteBlogTagForActor(
  actor: AuthorizationPrincipal | null,
  id: string,
  repository: BlogPostRepository,
): Promise<void> {
  const authorizedActor = assertPermission(actor, Permission.MANAGE_BLOG_TAXONOMY);
  await repository.deleteTag(parseObjectId(id, "tagId"), authorizedActor.id);
}

export async function getPublicBlogPosts(
  query: BlogListQuery,
  repository: BlogPostRepository,
): Promise<BlogPageResult> {
  const result = await repository.findPublicPosts(query);

  return {
    ...result,
    items: result.items.filter(
      (post) => post.status === BlogPostStatus.PUBLISHED && post.publishedAt !== null,
    ),
  };
}

export async function getPublicBlogPostBySlug(
  slug: string,
  repository: BlogPostRepository,
): Promise<BlogPostRecord | null> {
  const post = await repository.findPublicBySlug(slug);

  if (!post || post.status !== BlogPostStatus.PUBLISHED || !post.publishedAt) {
    return null;
  }

  return post;
}

export function getPublicBlogTaxonomy(repository: BlogPostRepository): Promise<{
  categories: BlogTaxonomyRecord[];
  tags: BlogTagRecord[];
}> {
  return Promise.all([
    repository.listCategories({ activeOnly: true }),
    repository.listTags({ activeOnly: true }),
  ]).then(([categories, tags]) => ({ categories, tags }));
}

export function getPublishedBlogSlugs(repository: BlogPostRepository): Promise<string[]> {
  return repository.findPublishedSlugs();
}
