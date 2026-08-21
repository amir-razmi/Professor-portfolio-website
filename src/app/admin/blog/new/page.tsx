import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Permission, hasPermission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";

import { BlogPostForm } from "@/features/blog/components/blog-post-form";
import { getAdminBlogTaxonomy } from "@/features/blog/server/blog-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "یادداشت جدید",
};

export default async function NewBlogPostPage() {
  const admin = await requirePagePermission(Permission.MANAGE_BLOG_POSTS);
  const taxonomy = await getAdminBlogTaxonomy(admin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          eyebrow="یادداشت جدید"
          title="یک یادداشت دانشگاهی تازه آغاز کنید."
          description="ابتدا پیش‌نویس را ذخیره کنید و پس از آماده‌شدن محتوا، پیوندها و دسته‌بندی آن را منتشر کنید."
        />
        <BlogPostForm
          initialPost={null}
          categories={taxonomy.categories}
          tags={taxonomy.tags}
          canPublish={hasPermission(admin, Permission.PUBLISH_BLOG_POSTS)}
        />
      </div>
    </div>
  );
}
