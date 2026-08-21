import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PublicEmptyState } from "@/features/public-content/components/public-empty-state";
import { PublicPageHeader } from "@/features/public-content/components/public-page-header";
import { PublicFileCard } from "@/features/files/components/public-file-card";
import { listPublicFiles } from "@/features/files/server/file-service";
import { createPublicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPublicMetadata({
  title: "فایل‌ها و دانلودها",
  description: "اسناد و منابع دانشگاهی به‌اشتراک‌گذاشته‌شده در سایت استاد.",
  path: "/files",
});

export default async function PublicFilesPage() {
  const files = await listPublicFiles();

  return (
    <>
      <PublicPageHeader
        eyebrow="منابع"
        title="فایل‌ها و دانلودها."
        description="اسناد و منابع دانشگاهی را مرور کنید. فایل‌های عمومی مستقیماً قابل دانلود هستند و فایل‌های محدود برای شفافیت فهرست می‌شوند."
      />
      <Container className="py-12 sm:py-16 lg:py-20">
        <section aria-labelledby="public-files-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="public-files-heading"
              className="text-2xl font-semibold tracking-tight text-slate-950"
            >
              منابع موجود
            </h2>
            <p className="text-sm text-muted">{files.length} فایل</p>
          </div>

          {files.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {files.map((file) => (
                <PublicFileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <PublicEmptyState
                headingLevel="h3"
                title="هنوز فایلی در دسترس نیست."
                description="اسناد و منابع قابل دانلود پس از انتشار در اینجا نمایش داده می‌شوند."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
