import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Permission, hasPermission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { BlogPostStatus } from "@prisma/client";

import { BlogTaxonomyManager } from "@/features/blog/components/blog-taxonomy-manager";
import {
  BlogStatusBadge,
  BlogWorkflowActions,
} from "@/features/blog/components/blog-workflow-actions";
import { normalizeBlogListQuery } from "@/features/blog/blog-schema";
import { getAdminBlogPosts, getAdminBlogTaxonomy } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog management",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminBlogPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const admin = await requirePagePermission(Permission.MANAGE_BLOG_POSTS);
  const query = normalizeBlogListQuery(await searchParams);
  const listQuery = { ...query, pageSize: 24 };
  const [posts, taxonomy] = await Promise.all([
    getAdminBlogPosts(admin, listQuery),
    getAdminBlogTaxonomy(admin),
  ]);
  const canPublish = hasPermission(admin, Permission.PUBLISH_BLOG_POSTS);
  const canManageTaxonomy = hasPermission(admin, Permission.MANAGE_BLOG_TAXONOMY);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminPageHeader
          eyebrow="Blog"
          title="Write and publish academic notes."
          description="Create concise public updates, keep drafts private, and use categories and tags to make the archive easy to browse."
          actions={
            <Link
              href="/admin/blog/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              New post
            </Link>
          }
        />

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          aria-labelledby="blog-list-heading"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="blog-list-heading"
                className="text-xl font-semibold tracking-tight text-slate-950"
              >
                Posts
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {posts.total} {posts.total === 1 ? "post" : "posts"} in the workspace.
              </p>
            </div>
            <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div>
                <label htmlFor="admin-blog-search" className="text-xs font-semibold text-slate-700">
                  Search
                </label>
                <input
                  id="admin-blog-search"
                  name="q"
                  type="search"
                  defaultValue={query.q ?? ""}
                  placeholder="Title or excerpt"
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-56"
                />
              </div>
              <div>
                <label htmlFor="admin-blog-status" className="text-xs font-semibold text-slate-700">
                  State
                </label>
                <select
                  id="admin-blog-status"
                  name="status"
                  defaultValue={query.status ?? ""}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-36"
                >
                  <option value="">All states</option>
                  <option value={BlogPostStatus.DRAFT}>Draft</option>
                  <option value={BlogPostStatus.PUBLISHED}>Published</option>
                  <option value={BlogPostStatus.ARCHIVED}>Archived</option>
                </select>
              </div>
              <button
                type="submit"
                className="min-h-10 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Filter
              </button>
            </form>
          </div>

          {posts.items.length ? (
            <div className="mt-5 space-y-4">
              {posts.items.map((post) => (
                <article key={post.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <BlogStatusBadge status={post.status} />
                        <span className="text-xs text-slate-500">
                          Updated {formatDate(post.updatedAt)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="underline decoration-transparent underline-offset-4 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                        >
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">/{post.slug}</p>
                      {post.excerpt ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                          {post.excerpt}
                        </p>
                      ) : null}
                      {post.categories.length || post.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.categories.map((category) => (
                            <span
                              key={category.id}
                              className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-900"
                            >
                              {category.name}
                            </span>
                          ))}
                          {post.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                      >
                        Edit post
                      </Link>
                      <BlogWorkflowActions
                        canPublish={canPublish}
                        postId={post.id}
                        status={post.status}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                {query.q || query.status ? "No matching posts." : "No blog posts yet."}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {query.q || query.status
                  ? "Try a different search or state filter."
                  : "Create the first draft when you are ready to publish an update."}
              </p>
            </div>
          )}
        </section>

        {canManageTaxonomy ? (
          <BlogTaxonomyManager categories={taxonomy.categories} tags={taxonomy.tags} />
        ) : null}
      </div>
    </div>
  );
}
