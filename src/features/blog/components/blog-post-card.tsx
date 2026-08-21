import Link from "next/link";

import type { BlogPostRecord } from "../server/blog-policy";

function formatPublishedDate(date: Date | null): string {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function excerptFor(post: BlogPostRecord): string {
  if (post.excerpt) {
    return post.excerpt;
  }

  const plainText = post.content.replace(/\s+/g, " ").trim();
  return plainText.length > 180 ? `${plainText.slice(0, 177)}…` : plainText;
}

export function BlogPostCard({
  post,
}: Readonly<{
  post: BlogPostRecord;
}>) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        <time dateTime={post.publishedAt?.toISOString()}>
          {formatPublishedDate(post.publishedAt)}
        </time>
        {post.authorName ? <span className="text-slate-400">{post.authorName}</span> : null}
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        <Link
          href={`/blog/${post.slug}`}
          className="rounded-sm underline decoration-transparent underline-offset-4 transition hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 flex-1 text-sm leading-7 text-muted">{excerptFor(post)}</p>

      {post.categories.length || post.tags.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${encodeURIComponent(category.slug)}`}
              className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {category.name}
            </Link>
          ))}
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog?tag=${encodeURIComponent(tag.slug)}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Read article <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
