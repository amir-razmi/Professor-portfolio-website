import { randomUUID } from "node:crypto";

import { FileCategory, FileVisibility } from "@prisma/client";

import { assertPermission } from "@/server/auth/access-control";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { Permission, type AuthorizationPrincipal } from "@/server/auth/permissions";

import {
  fileMetadataSchema,
  assertCategoryMatchesType,
  fileUnlockSchema,
  objectIdIsSafe,
  type FileMetadataInput,
  type FileMetadataPersistenceInput,
  type StoredUpload,
  type StoredPasswordState,
  validateUpload,
  type ValidatedUpload,
} from "../file-schema";
import { FileOperationError } from "./file-errors";
import { createFileAccessToken, verifyFileAccessToken } from "./file-access-token";

export type FileRecord = {
  id: string;
  displayName: string;
  safeOriginalName: string;
  storageKey: string;
  fileType: string;
  sizeBytes: number;
  category: FileCategory;
  description: string | null;
  visibility: FileVisibility;
  hasPassword: boolean;
  checksum: string | null;
  uploadedAt: Date;
  uploaderId: string;
  uploaderName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FilePasswordAccess = {
  id: string;
  visibility: FileVisibility;
  passwordHash: string | null;
  passwordVersion: string | null;
};

export type FileRepository = {
  list: (limit?: number) => Promise<FileRecord[]>;
  findById: (id: string) => Promise<FileRecord | null>;
  findPublicById: (id: string) => Promise<FileRecord | null>;
  findPasswordAccess: (id: string) => Promise<FilePasswordAccess | null>;
  create: (input: StoredUpload, actorId: string) => Promise<FileRecord>;
  updateMetadata: (
    id: string,
    input: FileMetadataPersistenceInput,
    actorId: string,
    passwordState?: StoredPasswordState,
  ) => Promise<FileRecord>;
  delete: (id: string, actorId: string) => Promise<void>;
};

export type FileStorage = {
  put: (key: string, data: Uint8Array) => Promise<void>;
  get: (key: string) => Promise<{ body: ReadableStream<Uint8Array>; sizeBytes: number } | null>;
  delete: (key: string) => Promise<void>;
};

function invalid(message: string, fieldErrors: Record<string, string[]> = {}): never {
  throw new FileOperationError(message, "INVALID_INPUT", fieldErrors);
}

function assertObjectId(id: string): string {
  if (!objectIdIsSafe(id)) {
    throw new FileOperationError("The requested file id is invalid.", "INVALID_INPUT", {
      id: ["Enter a valid file id."],
    });
  }

  return id;
}

function parseMetadata(input: unknown): FileMetadataInput {
  const parsed = fileMetadataSchema.safeParse(input);

  if (!parsed.success) {
    invalid("Review the file metadata fields.", parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

function assertFileManager(actor: AuthorizationPrincipal | null): AuthorizationPrincipal {
  return assertPermission(actor, Permission.MANAGE_FILES);
}

export async function listFilesForActor(
  actor: AuthorizationPrincipal | null,
  repository: FileRepository,
): Promise<FileRecord[]> {
  assertFileManager(actor);
  return repository.list();
}

export async function uploadFileForActor(
  actor: AuthorizationPrincipal | null,
  file: File,
  metadata: unknown,
  repository: FileRepository,
  storage: FileStorage,
): Promise<FileRecord> {
  const authorizedActor = assertFileManager(actor);
  let validated: ValidatedUpload;
  const parsedMetadata = fileMetadataSchema.safeParse(metadata);

  if (!parsedMetadata.success) {
    invalid("Review the file metadata fields.", parsedMetadata.error.flatten().fieldErrors);
  }

  try {
    validated = await validateUpload(file, parsedMetadata.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The uploaded file is invalid.";
    const field = /password/i.test(message) ? "password" : "file";
    invalid(message, { [field]: [message] });
  }

  const passwordHash = validated.password ? await hashPassword(validated.password) : null;
  const passwordVersion = validated.password ? randomUUID() : null;
  const storedUpload: StoredUpload = {
    displayName: validated.displayName,
    category: validated.category,
    description: validated.description,
    visibility: validated.visibility,
    bytes: validated.bytes,
    checksum: validated.checksum,
    fileType: validated.fileType,
    safeOriginalName: validated.safeOriginalName,
    sizeBytes: validated.sizeBytes,
    storageKey: validated.storageKey,
    passwordHash,
    passwordVersion,
  };

  try {
    await storage.put(validated.storageKey, validated.bytes);
  } catch {
    throw new FileOperationError(
      "The file could not be stored. No database record was created.",
      "STORAGE_UNAVAILABLE",
    );
  }

  try {
    return await repository.create(storedUpload, authorizedActor.id);
  } catch (error) {
    try {
      await storage.delete(validated.storageKey);
    } catch {
      throw new FileOperationError(
        "The file record could not be created and the stored file could not be cleaned up.",
        "CLEANUP_FAILED",
      );
    }

    throw error;
  }
}

export async function updateFileMetadataForActor(
  actor: AuthorizationPrincipal | null,
  id: string,
  input: unknown,
  repository: FileRepository,
): Promise<FileRecord> {
  const authorizedActor = assertFileManager(actor);
  const fileId = assertObjectId(id);
  const metadata = parseMetadata(input);
  const current = await repository.findById(fileId);

  if (!current) {
    throw new FileOperationError("The file could not be found.", "NOT_FOUND");
  }

  try {
    assertCategoryMatchesType(metadata.category, current.fileType);
  } catch (error) {
    invalid(error instanceof Error ? error.message : "The file category is not compatible.");
  }

  let passwordState: StoredPasswordState | undefined;

  if (metadata.visibility === FileVisibility.PASSWORD_PROTECTED) {
    if (metadata.clearPassword) {
      invalid("Keep a password set while using password-protected visibility.", {
        clearPassword: ["Remove protection by choosing Public or Private visibility."],
      });
    }

    if (metadata.password) {
      passwordState = {
        passwordHash: await hashPassword(metadata.password),
        passwordVersion: randomUUID(),
      };
    } else if (!current.hasPassword) {
      invalid("Enter a password for password-protected files.", {
        password: ["Enter a password before selecting password-protected visibility."],
      });
    }
  } else {
    if (metadata.password) {
      invalid("Choose password-protected visibility before adding a file password.", {
        password: ["Choose Password-protected visibility first."],
      });
    }

    if (current.hasPassword && !metadata.clearPassword) {
      invalid("Confirm removal before changing away from password protection.", {
        clearPassword: ["Check the removal confirmation box to continue."],
      });
    }

    // Switching away from password protection is an explicit, fail-safe removal.
    passwordState = {
      passwordHash: null,
      passwordVersion: null,
    };
  }

  const persistedMetadata: FileMetadataPersistenceInput = {
    displayName: metadata.displayName,
    category: metadata.category,
    description: metadata.description,
    visibility: metadata.visibility,
  };

  return repository.updateMetadata(fileId, persistedMetadata, authorizedActor.id, passwordState);
}

async function readObject(object: {
  body: ReadableStream<Uint8Array>;
  sizeBytes: number;
}): Promise<Uint8Array> {
  const buffer = await new Response(object.body).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.byteLength !== object.sizeBytes) {
    throw new FileOperationError(
      "The stored file size could not be verified.",
      "STORAGE_UNAVAILABLE",
    );
  }

  return bytes;
}

export async function deleteFileForActor(
  actor: AuthorizationPrincipal | null,
  id: string,
  repository: FileRepository,
  storage: FileStorage,
): Promise<void> {
  const authorizedActor = assertFileManager(actor);
  const fileId = assertObjectId(id);
  const record = await repository.findById(fileId);

  if (!record) {
    throw new FileOperationError("The file could not be found.", "NOT_FOUND");
  }

  const object = await storage.get(record.storageKey);

  if (!object) {
    throw new FileOperationError(
      "The stored file is missing; metadata was not deleted.",
      "STORAGE_UNAVAILABLE",
    );
  }

  const bytes = await readObject(object);
  await storage.delete(record.storageKey);

  try {
    await repository.delete(fileId, authorizedActor.id);
  } catch (error) {
    try {
      await storage.put(record.storageKey, bytes);
    } catch {
      throw new FileOperationError(
        "The database delete failed and the stored file could not be restored.",
        "CLEANUP_FAILED",
      );
    }

    throw error;
  }
}

export async function getPublicFileForDownload(
  id: string,
  repository: FileRepository,
  storage: FileStorage,
  accessToken?: string,
): Promise<{
  file: FileRecord;
  object: { body: ReadableStream<Uint8Array>; sizeBytes: number };
} | null> {
  if (!objectIdIsSafe(id)) {
    return null;
  }

  const file = await repository.findPublicById(id);

  if (!file) {
    return null;
  }

  if (file.visibility === FileVisibility.PASSWORD_PROTECTED) {
    const access = await repository.findPasswordAccess(file.id);

    if (
      !access ||
      !access.passwordHash ||
      !access.passwordVersion ||
      !accessToken ||
      !verifyFileAccessToken(accessToken, file.id, access.passwordVersion)
    ) {
      return null;
    }
  }

  const object = await storage.get(file.storageKey);

  return object ? { file, object } : null;
}

export async function unlockPublicFile(
  id: string,
  input: unknown,
  repository: FileRepository,
): Promise<{ token: string; expiresAt: Date }> {
  if (!objectIdIsSafe(id)) {
    throw new FileOperationError("The password could not unlock this file.", "INVALID_INPUT", {
      password: ["The password is incorrect."],
    });
  }

  const parsed = fileUnlockSchema.safeParse(input);

  if (!parsed.success) {
    throw new FileOperationError("The password could not unlock this file.", "INVALID_INPUT", {
      password: ["Enter the file password."],
    });
  }

  const access = await repository.findPasswordAccess(id);
  const valid =
    access?.visibility === FileVisibility.PASSWORD_PROTECTED &&
    Boolean(access.passwordHash) &&
    Boolean(access.passwordVersion) &&
    (await verifyPassword(parsed.data.password, access.passwordHash));

  if (!valid || !access?.passwordVersion) {
    throw new FileOperationError("The password could not unlock this file.", "INVALID_INPUT", {
      password: ["The password is incorrect."],
    });
  }

  const token = createFileAccessToken(id, access.passwordVersion);

  return {
    token,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };
}

export async function getFileForDownloadForActor(
  actor: AuthorizationPrincipal | null,
  id: string,
  repository: FileRepository,
  storage: FileStorage,
): Promise<{
  file: FileRecord;
  object: { body: ReadableStream<Uint8Array>; sizeBytes: number };
}> {
  assertFileManager(actor);
  const fileId = assertObjectId(id);
  const file = await repository.findById(fileId);

  if (!file) {
    throw new FileOperationError("The file could not be found.", "NOT_FOUND");
  }

  const object = await storage.get(file.storageKey);

  if (!object) {
    throw new FileOperationError("The stored file is missing.", "STORAGE_UNAVAILABLE");
  }

  return { file, object };
}
