import Link from "next/link";

import { Container } from "@/components/ui/container";

import type { BlogPostRecord } from "../server/blog-policy";
import { PlainTextContent } from "./plain-text-content";

function formatPublishedDate(date: Date | null): string {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(date);
}

export function BlogArticle({
  post,
}: Readonly<{
  post: BlogPostRecord;
}>) {
  return (
    <article>
      <header className="border-b border-line bg-white">
        <Container className="py-16 sm:py-20 lg:py-24">
          <Link
            href="/blog"
            className="text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            ← Back to blog
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatPublishedDate(post.publishedAt)}
            </time>
            {post.authorName ? <span className="text-slate-400">{post.authorName}</span> : null}
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{post.excerpt}</p>
          ) : null}
          {post.categories.length || post.tags.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
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
        </Container>
      </header>

      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <PlainTextContent
            content={post.content}
            className="space-y-6 text-base leading-8 text-slate-700 sm:text-lg sm:leading-9"
          />
        </div>
      </Container>
    </article>
  );
}
