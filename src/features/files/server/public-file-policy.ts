import { FileVisibility } from "@prisma/client";

import type { FileRecord, FileRepository } from "./file-policy";

/**
 * Safe metadata exposed by the public website. Internal storage keys, checksums,
 * and uploader details deliberately stay on the server.
 */
export type PublicFileRecord = {
  id: string;
  displayName: string;
  fileType: string;
  category: FileRecord["category"];
  description: string | null;
  visibility: FileVisibility;
  uploadedAt: Date;
  isRestricted: boolean;
  isPasswordProtected: boolean;
  downloadUrl: string | null;
  unlockUrl: string | null;
};

export function toPublicFileRecord(file: FileRecord): PublicFileRecord {
  const isRestricted = file.visibility !== FileVisibility.PUBLIC;
  const isPasswordProtected =
    file.visibility === FileVisibility.PASSWORD_PROTECTED && file.hasPassword;

  return {
    id: file.id,
    displayName: file.displayName,
    fileType: file.fileType,
    category: file.category,
    description: file.description,
    visibility: file.visibility,
    uploadedAt: file.uploadedAt,
    isRestricted,
    isPasswordProtected,
    downloadUrl: isRestricted ? null : `/api/files/public/${encodeURIComponent(file.id)}`,
    unlockUrl: isPasswordProtected
      ? `/api/files/public/${encodeURIComponent(file.id)}/unlock`
      : null,
  };
}

export async function listPublicFileRecords(
  repository: Pick<FileRepository, "list">,
): Promise<PublicFileRecord[]> {
  const files = await repository.list(100);
  return files.map(toPublicFileRecord);
}
