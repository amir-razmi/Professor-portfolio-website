import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { PublicEmptyState } from "@/features/public-content/components/public-empty-state";
import { PublicPageHeader } from "@/features/public-content/components/public-page-header";
import { PublicFileCard } from "@/features/files/components/public-file-card";
import { listPublicFiles } from "@/features/files/server/file-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Files & downloads",
  description: "Academic documents and resources shared through the professor's website.",
};

export default async function PublicFilesPage() {
  const files = await listPublicFiles();

  return (
    <>
      <PublicPageHeader
        eyebrow="Resources"
        title="Files and downloads."
        description="Browse academic documents and resources. Public files can be downloaded directly; restricted records are listed for transparency but remain available only to administrators."
      />
      <Container className="py-12 sm:py-16 lg:py-20">
        <section aria-labelledby="public-files-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="public-files-heading"
              className="text-2xl font-semibold tracking-tight text-slate-950"
            >
              Available resources
            </h2>
            <p className="text-sm text-muted">
              {files.length} {files.length === 1 ? "file" : "files"}
            </p>
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
                title="No files are available yet."
                description="Academic documents and downloadable resources will appear here when they are published."
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
