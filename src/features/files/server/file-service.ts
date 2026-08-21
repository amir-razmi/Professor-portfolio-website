import "server-only";

import { getStorageProvider } from "@/lib/storage";

import {
  deleteFileForActor,
  getFileForDownloadForActor,
  getPublicFileForDownload,
  listFilesForActor,
  unlockPublicFile,
  updateFileMetadataForActor,
  uploadFileForActor,
} from "./file-policy";
import { fileRepository } from "./file-repository";
import { listPublicFileRecords } from "./public-file-policy";

const storage = getStorageProvider();

export function listAdminFiles(actor: Parameters<typeof listFilesForActor>[0]) {
  return listFilesForActor(actor, fileRepository);
}

export function listPublicFiles() {
  return listPublicFileRecords(fileRepository);
}

export function uploadFile(
  actor: Parameters<typeof uploadFileForActor>[0],
  file: File,
  metadata: unknown,
) {
  return uploadFileForActor(actor, file, metadata, fileRepository, storage);
}

export function updateFileMetadata(
  actor: Parameters<typeof updateFileMetadataForActor>[0],
  id: string,
  input: unknown,
) {
  return updateFileMetadataForActor(actor, id, input, fileRepository);
}

export function deleteFile(actor: Parameters<typeof deleteFileForActor>[0], id: string) {
  return deleteFileForActor(actor, id, fileRepository, storage);
}

export function getPublicFileDownload(id: string, accessToken?: string) {
  return getPublicFileForDownload(id, fileRepository, storage, accessToken);
}

export function unlockFile(id: string, input: unknown) {
  return unlockPublicFile(id, input, fileRepository);
}

export function getAdminFileDownload(
  actor: Parameters<typeof getFileForDownloadForActor>[0],
  id: string,
) {
  return getFileForDownloadForActor(actor, id, fileRepository, storage);
}
