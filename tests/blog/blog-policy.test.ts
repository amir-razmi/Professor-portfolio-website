import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole, BlogPostStatus } from "@prisma/client";

import { splitPlainTextParagraphs } from "../../src/features/blog/components/plain-text-content";
import { blogPostSchema, normalizeBlogListQuery } from "../../src/features/blog/blog-schema";
import {
  deleteBlogPostForActor,
  getPublicBlogPosts,
  saveBlogPostForActor,
  saveBlogTagForActor,
  publishBlogPostForActor,
  type BlogPostRecord,
  type BlogPostRepository,
} from "../../src/features/blog/server/blog-policy";
import { ContentValidationError } from "../../src/server/content/content-errors";
import { ForbiddenError, UnauthorizedError } from "../../src/server/auth/authorization-error";

const admin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.ADMIN,
};
const editor = {
  id: "507f1f77bcf86cd799439012",
  role: AdminRole.EDITOR,
};

const publishedAt = new Date("2026-08-01T12:00:00.000Z");

function post(overrides: Partial<BlogPostRecord> = {}): BlogPostRecord {
  return {
    id: "507f1f77bcf86cd799439099",
    title: "Research notes",
    slug: "research-notes",
    excerpt: "A short summary.",
    content: "A paragraph.",
    status: BlogPostStatus.DRAFT,
    publishedAt: null,
    isFeatured: false,
    authorId: admin.id,
    authorName: "Development Admin",
    categoryIds: [],
    tagIds: [],
    categories: [],
    tags: [],
    createdAt: publishedAt,
    updatedAt: publishedAt,
    ...overrides,
  };
}

function repository(overrides: Partial<BlogPostRepository> = {}): BlogPostRepository {
  return {
    findById: async () => null,
    findAdminPosts: async (query) => ({
      items: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 0,
    }),
    findPublicPosts: async (query) => ({
      items: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: 0,
    }),
    findPublicBySlug: async () => null,
    findPublishedSlugs: async () => [],
    listCategories: async () => [],
    listTags: async () => [],
    savePost: async (input, actorId) =>
      post({
        id: input.id ?? "507f1f77bcf86cd799439098",
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        status: input.status,
        publishedAt: input.publishedAt,
        isFeatured: input.isFeatured,
        authorId: actorId,
      }),
    setPublicationState: async (id, status, nextPublishedAt) =>
      post({ id, status, publishedAt: nextPublishedAt }),
    deletePost: async () => undefined,
    saveCategory: async () => ({
      id: "507f1f77bcf86cd799439097",
      name: "Research",
      slug: "research",
      description: null,
      isActive: true,
      postCount: 0,
    }),
    saveTag: async () => ({
      id: "507f1f77bcf86cd799439096",
      name: "Methods",
      slug: "methods",
      isActive: true,
      postCount: 0,
    }),
    deleteCategory: async () => undefined,
    deleteTag: async () => undefined,
    ...overrides,
  };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    id: null,
    title: "Research notes",
    slug: "Research Notes",
    excerpt: "A short summary.",
    content: "A paragraph.",
    status: BlogPostStatus.DRAFT,
    publishedAt: null,
    categoryIds: [],
    tagIds: [],
    isFeatured: false,
    ...overrides,
  };
}

test("blog schema normalizes slugs and requires dates for published posts", () => {
  const draft = blogPostSchema.parse(validInput({ slug: "  Research Notes  " }));
  assert.equal(draft.slug, "research-notes");

  const invalidPublished = blogPostSchema.safeParse(
    validInput({ status: BlogPostStatus.PUBLISHED, publishedAt: null }),
  );
  assert.equal(invalidPublished.success, false);

  const published = blogPostSchema.parse(
    validInput({ status: BlogPostStatus.PUBLISHED, publishedAt }),
  );
  assert.equal(published.status, BlogPostStatus.PUBLISHED);
  assert.equal(published.publishedAt?.toISOString(), publishedAt.toISOString());
});

test("ADMIN can save a published post, while EDITOR can only create drafts", async () => {
  let saveCalls = 0;
  const store = repository({
    savePost: async (input, actorId) => {
      saveCalls += 1;
      return post({
        title: input.title,
        slug: input.slug,
        status: input.status,
        publishedAt: input.publishedAt,
        authorId: actorId,
      });
    },
  });

  const saved = await saveBlogPostForActor(
    admin,
    validInput({
      status: BlogPostStatus.PUBLISHED,
      publishedAt,
    }),
    store,
  );
  assert.equal(saved.status, BlogPostStatus.PUBLISHED);
  assert.equal(saveCalls, 1);

  const draft = await saveBlogPostForActor(editor, validInput(), store);
  assert.equal(draft.status, BlogPostStatus.DRAFT);
  assert.equal(saveCalls, 2);

  await assert.rejects(
    () =>
      saveBlogPostForActor(
        editor,
        validInput({ status: BlogPostStatus.PUBLISHED, publishedAt }),
        store,
      ),
    ForbiddenError,
  );
  assert.equal(saveCalls, 2);
});

test("EDITOR edits preserve publication-controlled fields on an existing post", async () => {
  const existing = post({
    status: BlogPostStatus.PUBLISHED,
    publishedAt,
    isFeatured: true,
  });
  const savedInput: { value: Record<string, unknown> | null } = { value: null };
  const store = repository({
    findById: async () => existing,
    savePost: async (input, actorId) => {
      savedInput.value = {
        ...input,
        actorId,
      };
      return post({
        ...existing,
        title: input.title,
        slug: input.slug,
        content: input.content,
      });
    },
  });

  await saveBlogPostForActor(
    editor,
    validInput({
      id: existing.id,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date("2030-01-01T00:00:00.000Z"),
      isFeatured: false,
    }),
    store,
  );

  assert.ok(savedInput.value);
  assert.equal(savedInput.value.isFeatured, true);
  assert.equal(savedInput.value.publishedAt, publishedAt);
});

test("EDITOR cannot invoke publication or taxonomy mutations", async () => {
  const store = repository();

  await assert.rejects(() => publishBlogPostForActor(editor, post().id, store), ForbiddenError);
  await assert.rejects(() => saveBlogPostForActor(null, validInput(), store), UnauthorizedError);
  await assert.rejects(
    () =>
      saveBlogTagForActor(
        editor,
        { id: null, name: "Methods", slug: "methods", isActive: true },
        store,
      ),
    ForbiddenError,
  );
});

test("public blog policy excludes draft records even if a repository returns one", async () => {
  const published = post({
    id: "507f1f77bcf86cd799439091",
    status: BlogPostStatus.PUBLISHED,
    publishedAt,
  });
  const draft = post({
    id: "507f1f77bcf86cd799439092",
    status: BlogPostStatus.DRAFT,
    publishedAt: null,
  });
  const result = await getPublicBlogPosts(
    normalizeBlogListQuery({}),
    repository({
      findPublicPosts: async (query) => ({
        items: [draft, published],
        total: 2,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: 1,
      }),
    }),
  );

  assert.deepEqual(
    result.items.map((item) => item.id),
    [published.id],
  );
});

test("duplicate slugs surface a field-level validation error", async () => {
  const duplicate = new ContentValidationError("A post with this slug already exists.", {
    slug: ["Choose a unique slug."],
  });
  const store = repository({
    savePost: async () => {
      throw duplicate;
    },
  });

  await assert.rejects(
    () => saveBlogPostForActor(admin, validInput(), store),
    (error: unknown) =>
      error instanceof ContentValidationError &&
      error.fieldErrors.slug?.[0] === "Choose a unique slug.",
  );
});

test("plain-text rendering keeps hostile markup as text and preserves paragraphs", () => {
  const content = '<script>alert("x")</script>\n\nA second paragraph with <b>literal</b> text.';
  assert.deepEqual(splitPlainTextParagraphs(content), [
    '<script>alert("x")</script>',
    "A second paragraph with <b>literal</b> text.",
  ]);
});

test("blog list query normalization caps invalid input to safe defaults", () => {
  assert.deepEqual(normalizeBlogListQuery({ page: "not-a-number", q: "  methods  " }), {
    q: "methods",
    category: null,
    tag: null,
    status: null,
    page: 1,
    pageSize: 10,
  });
});

test("delete requires an authenticated blog manager before repository access", async () => {
  let deleteCalls = 0;
  const store = repository({
    findById: async () => post(),
    deletePost: async () => {
      deleteCalls += 1;
    },
  });

  await assert.rejects(() => deleteBlogPostForActor(null, post().id, store), UnauthorizedError);
  assert.equal(deleteCalls, 0);
});
