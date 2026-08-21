import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticle } from "@/features/blog/components/blog-article";
import { getCachedPublicBlogPost } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

type BlogPostPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPublicBlogPost(slug);

  if (!post) {
    return {
      title: "Article not found",
      description: "The requested published article could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt ?? "Academic notes and updates.",
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? "Academic notes and updates.",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      url: `/blog/${post.slug}`,
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
