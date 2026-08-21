import Link from "next/link";

import type { BlogListQuery } from "../blog-schema";

function pageHref(query: BlogListQuery, page: number): string {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.tag) params.set("tag", query.tag);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}

export function BlogPagination({
  query,
  totalPages,
}: Readonly<{
  query: BlogListQuery;
  totalPages: number;
}>) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = query.page > 1 ? query.page - 1 : null;
  const nextPage = query.page < totalPages ? query.page + 1 : null;

  return (
    <nav
      aria-label="صفحه‌بندی یادداشت‌ها"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6"
    >
      {previousPage ? (
        <Link
          href={pageHref(query, previousPage)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← مقاله‌های جدیدتر
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted">
        صفحه {query.page} از {totalPages}
      </p>
      {nextPage ? (
        <Link
          href={pageHref(query, nextPage)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          مقاله‌های قدیمی‌تر →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
