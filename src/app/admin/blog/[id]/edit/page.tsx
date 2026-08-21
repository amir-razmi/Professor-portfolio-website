import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Permission, hasPermission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";

import { BlogPostForm, toBlogPostFormValue } from "@/features/blog/components/blog-post-form";
import { BlogWorkflowActions } from "@/features/blog/components/blog-workflow-actions";
import { getAdminBlogPost, getAdminBlogTaxonomy } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit blog post",
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const admin = await requirePagePermission(Permission.MANAGE_BLOG_POSTS);
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const post = await getAdminBlogPost(admin, id);

  if (!post) {
    notFound();
  }

  const taxonomy = await getAdminBlogTaxonomy(admin);
  const canPublish = hasPermission(admin, Permission.PUBLISH_BLOG_POSTS);
  const saved = search.saved === "1" || (Array.isArray(search.saved) && search.saved.includes("1"));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="Edit blog post"
          title={post.title}
          description={`Keep the article content and publication state current. The public URL is /blog/${post.slug}.`}
          actions={
            <BlogWorkflowActions canPublish={canPublish} postId={post.id} status={post.status} />
          }
        />
        {saved ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Blog post saved.
          </p>
        ) : null}
        <BlogPostForm
          initialPost={toBlogPostFormValue(post)}
          categories={taxonomy.categories}
          tags={taxonomy.tags}
          canPublish={canPublish}
        />
      </div>
    </div>
  );
}
