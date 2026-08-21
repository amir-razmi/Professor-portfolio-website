import "server-only";

import { FileVisibility, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { recordAuditLogInTransaction } from "@/server/audit/audit-service";

import type { FileMetadataPersistenceInput, StoredPasswordState } from "../file-schema";
import type { FilePasswordAccess, FileRecord, FileRepository } from "./file-policy";
import { FileOperationError } from "./file-errors";

const fileSelect = {
  id: true,
  displayName: true,
  safeOriginalName: true,
  storageKey: true,
  fileType: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  category: true,
  description: true,
  visibility: true,
  passwordHash: true,
  passwordVersion: true,
  checksum: true,
  uploadedAt: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: {
    select: {
      displayName: true,
    },
  },
} satisfies Prisma.FileAssetSelect;

type FilePayload = Prisma.FileAssetGetPayload<{ select: typeof fileSelect }>;

function mapFile(file: FilePayload): FileRecord {
  const safeOriginalName = file.safeOriginalName ?? file.originalName ?? "download";

  return {
    id: file.id,
    displayName: file.displayName ?? safeOriginalName,
    safeOriginalName,
    storageKey: file.storageKey,
    fileType: file.fileType ?? file.mimeType ?? "application/octet-stream",
    sizeBytes: Number(file.sizeBytes),
    category: file.category ?? "OTHER",
    description: file.description,
    visibility: file.visibility,
    hasPassword: Boolean(file.passwordHash && file.passwordVersion),
    checksum: file.checksum,
    uploadedAt: file.uploadedAt ?? file.createdAt,
    uploaderId: file.uploadedById,
    uploaderName: file.uploadedBy.displayName,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

function notFound(): never {
  throw new FileOperationError("The file could not be found.", "NOT_FOUND");
}

export const fileRepository: FileRepository = {
  async list(limit?: number) {
    const files = await prisma.fileAsset.findMany({
      orderBy: { uploadedAt: "desc" },
      ...(limit && limit > 0 ? { take: Math.min(Math.floor(limit), 1000) } : {}),
      select: fileSelect,
    });

    return files.map(mapFile);
  },

  async findById(id) {
    const file = await prisma.fileAsset.findUnique({
      where: { id },
      select: fileSelect,
    });

    return file ? mapFile(file) : null;
  },

  async findPublicById(id) {
    const file = await prisma.fileAsset.findFirst({
      where: {
        id,
        visibility: {
          in: [FileVisibility.PUBLIC, FileVisibility.PASSWORD_PROTECTED],
        },
      },
      select: fileSelect,
    });

    return file ? mapFile(file) : null;
  },

  async findPasswordAccess(id): Promise<FilePasswordAccess | null> {
    return prisma.fileAsset.findUnique({
      where: { id },
      select: {
        id: true,
        visibility: true,
        passwordHash: true,
        passwordVersion: true,
      },
    });
  },

  async create(input, actorId) {
    try {
      const file = await prisma.$transaction(async (transaction) => {
        const created = await transaction.fileAsset.create({
          data: {
            displayName: input.displayName,
            safeOriginalName: input.safeOriginalName,
            storageKey: input.storageKey,
            fileType: input.fileType,
            sizeBytes: BigInt(input.sizeBytes),
            category: input.category,
            description: input.description,
            visibility: input.visibility,
            passwordHash: input.passwordHash,
            passwordVersion: input.passwordVersion,
            checksum: input.checksum,
            uploadedById: actorId,
            createdById: actorId,
            updatedById: actorId,
            uploadedAt: new Date(),
          },
          select: fileSelect,
        });

        await recordAuditLogInTransaction(transaction, {
          action: "UPLOAD",
          targetResource: "FileAsset",
          targetId: created.id,
          summary: "File uploaded.",
          actorId,
          metadata: {
            visibility: input.visibility,
            category: input.category,
            fileType: input.fileType,
            sizeBytes: input.sizeBytes,
          },
        });

        return created;
      });

      return mapFile(file);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new FileOperationError(
          "A file with this storage key already exists.",
          "INVALID_INPUT",
        );
      }

      throw error;
    }
  },

  async updateMetadata(
    id,
    input: FileMetadataPersistenceInput,
    actorId,
    passwordState?: StoredPasswordState,
  ) {
    const current = await prisma.fileAsset.findUnique({
      where: { id },
      select: { visibility: true },
    });

    if (!current) {
      notFound();
    }

    const file = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.fileAsset.update({
        where: { id },
        data: {
          displayName: input.displayName,
          category: input.category,
          description: input.description,
          visibility: input.visibility,
          updatedById: actorId,
          ...(passwordState
            ? {
                passwordHash: passwordState.passwordHash,
                passwordVersion: passwordState.passwordVersion,
              }
            : {}),
        },
        select: fileSelect,
      });

      await recordAuditLogInTransaction(transaction, {
        action:
          current.visibility !== input.visibility
            ? input.visibility === FileVisibility.PUBLIC
              ? "ENABLE"
              : "DISABLE"
            : "UPDATE",
        targetResource: "FileAsset",
        targetId: id,
        summary: "File metadata updated.",
        actorId,
        metadata: {
          visibility: input.visibility,
          category: input.category,
        },
      });

      return updated;
    });

    return mapFile(file);
  },

  async delete(id, actorId) {
    await prisma.$transaction(async (transaction) => {
      const file = await transaction.fileAsset.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!file) {
        notFound();
      }

      await transaction.fileAsset.delete({ where: { id } });
      await recordAuditLogInTransaction(transaction, {
        action: "DELETE_FILE",
        targetResource: "FileAsset",
        targetId: id,
        summary: "File deleted.",
        actorId,
      });
    });
  },
};
