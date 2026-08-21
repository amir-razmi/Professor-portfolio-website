import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole, FileCategory, FileVisibility } from "@prisma/client";

import { hashPassword } from "../../src/server/auth/password";
import {
  getPublicFileForDownload,
  type FilePasswordAccess,
  type FileRecord,
  type FileRepository,
  type FileStorage,
  unlockPublicFile,
  updateFileMetadataForActor,
  uploadFileForActor,
} from "../../src/features/files/server/file-policy";
import {
  createFileAccessToken,
  verifyFileAccessToken,
} from "../../src/features/files/server/file-access-token";

const authSecret = "file-access-test-secret-that-is-at-least-32-chars";
process.env.AUTH_SECRET = authSecret;

const admin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.ADMIN,
};
const fileId = "507f1f77bcf86cd799439012";
const passwordVersion = "password-version-1";
const uploadedAt = new Date("2026-08-21T00:00:00.000Z");
const password = "correct horse battery staple";

function record(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: fileId,
    displayName: "Restricted handout",
    safeOriginalName: "handout.pdf",
    storageKey: "document/123e4567-e89b-12d3-a456-426614174000.pdf",
    fileType: "application/pdf",
    sizeBytes: 9,
    category: FileCategory.DOCUMENT,
    description: "A protected development document.",
    visibility: FileVisibility.PASSWORD_PROTECTED,
    hasPassword: true,
    checksum: null,
    uploadedAt,
    uploaderId: admin.id,
    uploaderName: "Development Admin",
    createdAt: uploadedAt,
    updatedAt: uploadedAt,
    ...overrides,
  };
}

function storage(bytes = new TextEncoder().encode("%PDF-1.7\n")): FileStorage {
  return {
    put: async () => undefined,
    get: async () => ({
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
      sizeBytes: bytes.byteLength,
    }),
    delete: async () => undefined,
  };
}

function repository(overrides: Partial<FileRepository> = {}): FileRepository {
  const protectedRecord = record();

  return {
    list: async () => [protectedRecord],
    findById: async () => protectedRecord,
    findPublicById: async () => protectedRecord,
    findPasswordAccess: async (): Promise<FilePasswordAccess> => ({
      id: protectedRecord.id,
      visibility: protectedRecord.visibility,
      passwordHash: await hashPassword(password),
      passwordVersion,
    }),
    create: async (input) =>
      record({
        displayName: input.displayName,
        visibility: input.visibility,
        hasPassword: Boolean(input.passwordHash),
      }),
    updateMetadata: async (id, input, _actorId, passwordState) =>
      record({
        id,
        displayName: input.displayName,
        category: input.category,
        description: input.description,
        visibility: input.visibility,
        hasPassword: passwordState ? Boolean(passwordState.passwordHash) : true,
      }),
    delete: async () => undefined,
    ...overrides,
  };
}

function makePdf(): File {
  return new File([new TextEncoder().encode("%PDF-1.7\n")], "handout.pdf", {
    type: "application/pdf",
  });
}

test("the correct password unlocks a protected file for a short-lived download", async () => {
  const unlocked = await unlockPublicFile(fileId, { password }, repository());

  assert.equal(
    verifyFileAccessToken(unlocked.token, fileId, passwordVersion, Date.now(), authSecret),
    true,
  );

  const result = await getPublicFileForDownload(fileId, repository(), storage(), unlocked.token);

  assert.ok(result);
  assert.equal(result.file.visibility, FileVisibility.PASSWORD_PROTECTED);
});

test("wrong passwords are rejected without granting an access token", async () => {
  await assert.rejects(
    () => unlockPublicFile(fileId, { password: "incorrect password value" }, repository()),
    /password could not unlock|incorrect/i,
  );
});

test("access tokens reject tampering and expire", () => {
  const now = Date.parse("2026-08-21T12:00:00.000Z");
  const token = createFileAccessToken(fileId, passwordVersion, now, authSecret);

  assert.equal(
    verifyFileAccessToken(token, fileId, passwordVersion, now + 14 * 60 * 1000, authSecret),
    true,
  );
  assert.equal(
    verifyFileAccessToken(token, fileId, passwordVersion, now + 16 * 60 * 1000, authSecret),
    false,
  );
  assert.equal(
    verifyFileAccessToken(`${token}tampered`, fileId, passwordVersion, now, authSecret),
    false,
  );
});

test("upload persistence receives only a password hash", async () => {
  let storedInput: Record<string, unknown> | null = null;
  const store = repository({
    create: async (input) => {
      storedInput = input as unknown as Record<string, unknown>;
      return record({ visibility: input.visibility, hasPassword: Boolean(input.passwordHash) });
    },
  });

  await uploadFileForActor(
    admin,
    makePdf(),
    {
      displayName: "Protected handout",
      category: FileCategory.DOCUMENT,
      description: "Protected",
      visibility: FileVisibility.PASSWORD_PROTECTED,
      password,
    },
    store,
    storage(),
  );

  const captured = storedInput as Record<string, unknown> | null;
  if (!captured) {
    throw new Error("The repository did not receive a stored file.");
  }
  assert.equal("password" in captured, false);
  assert.equal(captured.passwordHash === password, false);
  assert.match(String(captured.passwordHash), /^\$2[aby]\$/);
  assert.equal(typeof captured.passwordVersion, "string");
});

test("metadata updates hash a new password and switching visibility removes it", async () => {
  const mutations: Array<{ hash: string | null; version: string | null }> = [];
  const store = repository({
    updateMetadata: async (id, input, _actorId, passwordState) => {
      mutations.push({
        hash: passwordState?.passwordHash ?? null,
        version: passwordState?.passwordVersion ?? null,
      });
      return record({
        id,
        visibility: input.visibility,
        hasPassword: Boolean(passwordState?.passwordHash),
      });
    },
  });

  await updateFileMetadataForActor(
    admin,
    fileId,
    {
      displayName: "Updated handout",
      category: FileCategory.DOCUMENT,
      description: "Updated",
      visibility: FileVisibility.PASSWORD_PROTECTED,
      password: "a new secure file password",
    },
    store,
  );
  await updateFileMetadataForActor(
    admin,
    fileId,
    {
      displayName: "Public handout",
      category: FileCategory.DOCUMENT,
      description: "Public",
      visibility: FileVisibility.PUBLIC,
      clearPassword: true,
    },
    store,
  );

  assert.equal(mutations.length, 2);
  assert.notEqual(mutations[0]?.hash, "a new secure file password");
  assert.match(mutations[0]?.hash ?? "", /^\$2[aby]\$/);
  assert.equal(mutations[1]?.hash, null);
  assert.equal(mutations[1]?.version, null);
});

test("public files remain direct downloads and private files remain inaccessible", async () => {
  const publicRecord = record({
    visibility: FileVisibility.PUBLIC,
    hasPassword: false,
  });
  const publicRepository = repository({
    findPublicById: async () => publicRecord,
  });
  const publicResult = await getPublicFileForDownload(fileId, publicRepository, storage());

  assert.ok(publicResult);

  const privateRepository = repository({
    findPublicById: async () => null,
  });
  const privateResult = await getPublicFileForDownload(
    fileId,
    privateRepository,
    storage(),
    createFileAccessToken(fileId, passwordVersion, Date.now(), authSecret),
  );

  assert.equal(privateResult, null);
});
