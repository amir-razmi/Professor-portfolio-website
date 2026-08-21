import assert from "node:assert/strict";
import test from "node:test";

import { FileCategory, FileVisibility } from "@prisma/client";

import {
  listPublicFileRecords,
  toPublicFileRecord,
} from "../../src/features/files/server/public-file-policy";
import type { FileRecord } from "../../src/features/files/server/file-policy";

const uploadedAt = new Date("2026-08-20T00:00:00.000Z");

function file(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "507f1f77bcf86cd799439011",
    displayName: "Research handout",
    safeOriginalName: "research-handout.pdf",
    storageKey: "document/123e4567-e89b-12d3-a456-426614174000.pdf",
    fileType: "application/pdf",
    sizeBytes: 128,
    category: FileCategory.DOCUMENT,
    description: "A public research handout.",
    visibility: FileVisibility.PUBLIC,
    checksum: "private-checksum",
    uploadedAt,
    uploaderId: "507f1f77bcf86cd799439012",
    uploaderName: "Development Admin",
    createdAt: uploadedAt,
    updatedAt: uploadedAt,
    ...overrides,
  };
}

test("public file projection keeps safe metadata and exposes downloads only for public files", () => {
  const publicFile = toPublicFileRecord(file());
  const restrictedFile = toPublicFileRecord(
    file({
      id: "507f1f77bcf86cd799439013",
      visibility: FileVisibility.PRIVATE,
      displayName: "Internal review notes",
    }),
  );

  assert.equal(publicFile.displayName, "Research handout");
  assert.equal(publicFile.downloadUrl, "/api/files/public/507f1f77bcf86cd799439011");
  assert.equal(publicFile.isRestricted, false);
  assert.equal(restrictedFile.isRestricted, true);
  assert.equal(restrictedFile.downloadUrl, null);
  assert.equal("storageKey" in publicFile, false);
  assert.equal("uploaderId" in publicFile, false);
  assert.equal("checksum" in publicFile, false);
});

test("public file listing includes visible and restricted records", async () => {
  const records = await listPublicFileRecords({
    list: async () => [
      file(),
      file({
        id: "507f1f77bcf86cd799439013",
        visibility: FileVisibility.PRIVATE,
        displayName: "Internal review notes",
      }),
    ],
  });

  assert.deepEqual(
    records.map((record) => ({
      name: record.displayName,
      restricted: record.isRestricted,
      canDownload: Boolean(record.downloadUrl),
    })),
    [
      { name: "Research handout", restricted: false, canDownload: true },
      { name: "Internal review notes", restricted: true, canDownload: false },
    ],
  );
});
