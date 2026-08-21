import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PublicEmptyState } from "@/features/public-content/components/public-empty-state";
import { PublicPageHeader } from "@/features/public-content/components/public-page-header";

import { BlogFilters } from "@/features/blog/components/blog-filters";
import { BlogPagination } from "@/features/blog/components/blog-pagination";
import { BlogPostCard } from "@/features/blog/components/blog-post-card";
import { normalizeBlogListQuery } from "@/features/blog/blog-schema";
import { getPublicBlogFilters, getPublicBlogList } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Academic notes, research updates, and reflections.",
};

export default async function PublicBlogPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const query = normalizeBlogListQuery(await searchParams);
  const [result, filters] = await Promise.all([getPublicBlogList(query), getPublicBlogFilters()]);

  return (
    <>
      <PublicPageHeader
        eyebrow="Blog"
        title="Academic notes and updates."
        description="Published reflections on research, teaching, and the work behind an academic portfolio."
      />
      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="space-y-8">
          <BlogFilters categories={filters.categories} current={query} tags={filters.tags} />

          <section aria-labelledby="public-blog-list-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2
                id="public-blog-list-heading"
                className="text-2xl font-semibold tracking-tight text-slate-950"
              >
                Published articles
              </h2>
              <p className="text-sm text-muted">
                {result.total} {result.total === 1 ? "article" : "articles"}
              </p>
            </div>

            {result.items.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {result.items.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <PublicEmptyState
                  headingLevel="h3"
                  title="No published articles match this view."
                  description={
                    query.q || query.category || query.tag
                      ? "Try clearing a filter or searching for a different phrase."
                      : "Published academic notes will appear here when they are ready."
                  }
                />
              </div>
            )}

            <div className="mt-8">
              <BlogPagination query={query} totalPages={result.totalPages} />
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
