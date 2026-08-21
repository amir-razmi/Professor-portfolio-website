import Link from "next/link";

import type { BlogListQuery } from "../blog-schema";
import type { BlogTagRecord, BlogTaxonomyRecord } from "../server/blog-policy";

export function BlogFilters({
  categories,
  current,
  tags,
}: Readonly<{
  categories: BlogTaxonomyRecord[];
  current: BlogListQuery;
  tags: BlogTagRecord[];
}>) {
  return (
    <form
      method="get"
      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto] sm:items-end"
    >
      <div>
        <label htmlFor="blog-search" className="text-sm font-semibold text-slate-900">
          Search articles
        </label>
        <input
          id="blog-search"
          name="q"
          type="search"
          defaultValue={current.q ?? ""}
          placeholder="Search by title or excerpt"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div>
        <label htmlFor="blog-category" className="text-sm font-semibold text-slate-900">
          Category
        </label>
        <select
          id="blog-category"
          name="category"
          defaultValue={current.category ?? ""}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="blog-tag" className="text-sm font-semibold text-slate-900">
          Tag
        </label>
        <select
          id="blog-tag"
          name="tag"
          defaultValue={current.tag ?? ""}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 sm:justify-end">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Filter
        </button>
        {current.q || current.category || current.tag ? (
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
