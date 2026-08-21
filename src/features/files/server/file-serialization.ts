import type { FileRecord } from "./file-policy";

export function serializeAdminFile(file: FileRecord) {
  return {
    id: file.id,
    displayName: file.displayName,
    safeOriginalName: file.safeOriginalName,
    fileType: file.fileType,
    sizeBytes: file.sizeBytes,
    category: file.category,
    description: file.description,
    visibility: file.visibility,
    hasPassword: file.hasPassword,
    checksum: file.checksum,
    uploadedAt: file.uploadedAt.toISOString(),
    uploaderName: file.uploaderName,
    updatedAt: file.updatedAt.toISOString(),
    downloadUrl: file.visibility === "PUBLIC" ? `/api/files/public/${file.id}` : null,
    adminDownloadUrl: `/api/admin/files/${file.id}/download`,
  };
}
