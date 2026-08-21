import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FileManager } from "@/features/files/components/file-manager";
import { listAdminFiles } from "@/features/files/server/file-service";
import { serializeAdminFile } from "@/features/files/server/file-serialization";
import { Permission } from "@/server/auth/authorization";
import { requirePagePermission } from "@/server/auth/page-authorization";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "File management",
};

export default async function AdminFilesPage() {
  const admin = await requirePagePermission(Permission.MANAGE_FILES);
  const files = await listAdminFiles(admin);

  const initialFiles = files.map(serializeAdminFile);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminPageHeader
          eyebrow="Files"
          title="Manage documents and media safely."
          description="Upload verified files, keep private assets off public URLs, and maintain metadata without storing binary content in MongoDB."
        />
        <FileManager initialFiles={initialFiles} />
      </div>
    </div>
  );
}
