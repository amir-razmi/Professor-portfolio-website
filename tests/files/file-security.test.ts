import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { AdminRole, FileCategory, FileVisibility } from "@prisma/client";

import { LocalStorageProvider } from "../../src/lib/storage/local-storage-provider";
import { assertSafeStorageKey } from "../../src/lib/storage/storage-provider";
import {
  MAX_FILE_SIZE_BYTES,
  sanitizeOriginalFilename,
  validateUpload,
} from "../../src/features/files/file-schema";
import {
  deleteFileForActor,
  getFileForDownloadForActor,
  getPublicFileForDownload,
  updateFileMetadataForActor,
  uploadFileForActor,
  type FileRecord,
  type FileRepository,
  type FileStorage,
} from "../../src/features/files/server/file-policy";
import { FileOperationError } from "../../src/features/files/server/file-errors";
import { ForbiddenError } from "../../src/server/auth/authorization-error";

const admin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.ADMIN,
};
const editor = {
  id: "507f1f77bcf86cd799439012",
  role: AdminRole.EDITOR,
};

const baseDate = new Date("2026-08-21T00:00:00.000Z");

function makeFile(name: string, bytes: Uint8Array, type = "application/octet-stream"): File {
  return new File([Buffer.from(bytes)], name, { type });
}

function metadata(overrides: Record<string, unknown> = {}) {
  return {
    displayName: "Development handout",
    category: FileCategory.DOCUMENT,
    description: "A development-only file.",
    visibility: FileVisibility.PRIVATE,
    ...overrides,
  };
}

function record(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "507f1f77bcf86cd799439099",
    displayName: "Development handout",
    safeOriginalName: "handout.pdf",
    storageKey: "document/123e4567-e89b-12d3-a456-426614174000.pdf",
    fileType: "application/pdf",
    sizeBytes: 9,
    category: FileCategory.DOCUMENT,
    description: "A development-only file.",
    visibility: FileVisibility.PRIVATE,
    hasPassword: false,
    checksum: "abc123",
    uploadedAt: baseDate,
    uploaderId: admin.id,
    uploaderName: "Development Admin",
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

function repository(overrides: Partial<FileRepository> = {}): FileRepository {
  return {
    list: async () => [],
    findById: async () => record(),
    findPublicById: async () => null,
    findPasswordAccess: async () => null,
    create: async (input, actorId) =>
      record({
        displayName: input.displayName,
        safeOriginalName: input.safeOriginalName,
        storageKey: input.storageKey,
        fileType: input.fileType,
        sizeBytes: input.sizeBytes,
        category: input.category,
        description: input.description,
        visibility: input.visibility,
        checksum: input.checksum,
        uploaderId: actorId,
      }),
    updateMetadata: async (id, input) =>
      record({
        id,
        displayName: input.displayName,
        category: input.category,
        description: input.description,
        visibility: input.visibility,
      }),
    delete: async () => undefined,
    ...overrides,
  };
}

function memoryStorage(initial: Record<string, Uint8Array> = {}): FileStorage & {
  values: Map<string, Uint8Array>;
} {
  const values = new Map(Object.entries(initial));

  return {
    values,
    put: async (key, bytes) => {
      values.set(key, new Uint8Array(bytes));
    },
    get: async (key) => {
      const bytes = values.get(key);

      if (!bytes) return null;

      return {
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        }),
        sizeBytes: bytes.byteLength,
      };
    },
    delete: async (key) => {
      values.delete(key);
    },
  };
}

test("safe filenames reject path traversal and executable extensions", () => {
  assert.throws(() => sanitizeOriginalFilename("../../secret.pdf"), /Path separators/);
  assert.throws(() => sanitizeOriginalFilename("run.sh"), /extension is not allowed/);
  assert.equal(sanitizeOriginalFilename("résumé final.pdf"), "résumé final.pdf");
  assert.throws(() => assertSafeStorageKey("../escape.pdf"), /Unsafe storage key/);
  assert.throws(
    () => assertSafeStorageKey("document/123e4567-e89b-12d3-a456-426614174000"),
    /Unsafe storage key/,
  );
});

test("upload validation checks actual signatures, MIME agreement, size, and category", async () => {
  const pdf = makeFile("paper.pdf", new TextEncoder().encode("%PDF-1.7\n"), "application/pdf");
  const validated = await validateUpload(pdf, metadata({ category: FileCategory.PUBLICATION_PDF }));

  assert.equal(validated.fileType, "application/pdf");
  assert.equal(validated.safeOriginalName, "paper.pdf");
  assert.equal(validated.checksum.length, 64);

  await assert.rejects(
    () =>
      validateUpload(
        makeFile("paper.pdf", new TextEncoder().encode("not a pdf"), "application/pdf"),
        metadata(),
      ),
    /file type is not allowed|contents/,
  );
  await assert.rejects(
    () => validateUpload(pdf, metadata({ category: FileCategory.PROFILE_IMAGE })),
    /Profile images/,
  );
  await assert.rejects(
    () =>
      validateUpload(
        makeFile("paper.pdf", new TextEncoder().encode("%PDF-1.7\n"), "image/png"),
        metadata(),
      ),
    /MIME type/,
  );
  await assert.rejects(
    () =>
      validateUpload(
        makeFile("huge.txt", new Uint8Array(MAX_FILE_SIZE_BYTES + 1), "text/plain"),
        metadata(),
      ),
    /between 1 byte/,
  );
  await assert.rejects(
    () =>
      validateUpload(
        makeFile("script.txt", new TextEncoder().encode("#!/bin/sh\necho unsafe"), "text/plain"),
        metadata(),
      ),
    /file type is not allowed/,
  );
});

test("local storage confines keys and cleans up stored objects", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-storage-"));
  const provider = new LocalStorageProvider(root);
  const key = "document/123e4567-e89b-12d3-a456-426614174000.txt";
  const bytes = new TextEncoder().encode("hello");

  try {
    await provider.put(key, bytes);
    const stored = await provider.get(key);
    assert.ok(stored);
    assert.deepEqual(new Uint8Array(await new Response(stored.body).arrayBuffer()), bytes);
    assert.deepEqual(new Uint8Array(await readFile(path.join(root, key))), bytes);

    await assert.rejects(() => provider.put("../outside.txt", bytes), /Unsafe storage key/);

    await provider.delete(key);
    assert.equal(await provider.get(key), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("only authorized administrators can upload", async () => {
  const storage = memoryStorage();
  const file = makeFile("paper.pdf", new TextEncoder().encode("%PDF-1.7\n"), "application/pdf");

  await assert.rejects(
    () => uploadFileForActor(editor, file, metadata(), repository(), storage),
    ForbiddenError,
  );
  assert.equal(storage.values.size, 0);

  const created = await uploadFileForActor(admin, file, metadata(), repository(), storage);
  assert.equal(created.fileType, "application/pdf");
  assert.equal(storage.values.size, 1);
});

test("public download policy rejects private records and streams public records", async () => {
  const privateStorage = memoryStorage({
    "document/123e4567-e89b-12d3-a456-426614174000.pdf": new TextEncoder().encode("%PDF-1.7\n"),
  });
  const privateResult = await getPublicFileForDownload(
    record().id,
    repository({ findPublicById: async () => null }),
    privateStorage,
  );
  assert.equal(privateResult, null);

  const publicRecord = record({
    visibility: FileVisibility.PUBLIC,
  });
  const publicResult = await getPublicFileForDownload(
    publicRecord.id,
    repository({ findPublicById: async () => publicRecord }),
    privateStorage,
  );
  assert.ok(publicResult);
  assert.equal(publicResult.file.visibility, FileVisibility.PUBLIC);
});

test("administrator downloads require file permission and can stream private records", async () => {
  const privateRecord = record({ visibility: FileVisibility.PRIVATE });
  const storage = memoryStorage({
    [privateRecord.storageKey]: new TextEncoder().encode("%PDF-1.7\n"),
  });

  await assert.rejects(
    () =>
      getFileForDownloadForActor(
        editor,
        privateRecord.id,
        repository({ findById: async () => privateRecord }),
        storage,
      ),
    ForbiddenError,
  );

  const result = await getFileForDownloadForActor(
    admin,
    privateRecord.id,
    repository({ findById: async () => privateRecord }),
    storage,
  );

  assert.equal(result.file.visibility, FileVisibility.PRIVATE);
});

test("metadata updates cannot assign an incompatible file category", async () => {
  const file = record({ fileType: "application/pdf" });

  await assert.rejects(
    () =>
      updateFileMetadataForActor(
        admin,
        file.id,
        metadata({ category: FileCategory.PROFILE_IMAGE }),
        repository({ findById: async () => file }),
      ),
    /Profile images/,
  );
});

test("delete cleanup restores storage when database deletion fails", async () => {
  const file = record();
  const storage = memoryStorage({
    [file.storageKey]: new TextEncoder().encode("%PDF-1.7\n"),
  });
  const failingRepository = repository({
    findById: async () => file,
    delete: async () => {
      throw new Error("database unavailable");
    },
  });

  await assert.rejects(
    () => deleteFileForActor(admin, file.id, failingRepository, storage),
    /database unavailable/,
  );
  assert.equal(storage.values.has(file.storageKey), true);
});

test("delete refuses to remove metadata when the stored binary is missing", async () => {
  let deleteCalls = 0;
  const file = record();
  const storage = memoryStorage();
  const store = repository({
    findById: async () => file,
    delete: async () => {
      deleteCalls += 1;
    },
  });

  await assert.rejects(
    () => deleteFileForActor(admin, file.id, store, storage),
    (error: unknown) => error instanceof FileOperationError && error.code === "STORAGE_UNAVAILABLE",
  );
  assert.equal(deleteCalls, 0);
});
