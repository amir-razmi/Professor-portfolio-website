import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticle } from "@/features/blog/components/blog-article";
import { getCachedPublicBlogPost } from "@/features/blog/server/blog-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type BlogPostPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPublicBlogPost(slug);

  if (!post) {
    return {
      title: "یادداشت پیدا نشد",
      description: "یادداشت منتشرشده موردنظر پیدا نشد.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const metadata = createPublicMetadata({
    title: post.title,
    description: post.excerpt ?? "یادداشت‌ها و تازه‌های دانشگاهی.",
    path: `/blog/${post.slug}`,
    type: "article",
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
    },
  };
}

export default async function PublicBlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getCachedPublicBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogArticle post={post} />;
}
