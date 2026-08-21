import "server-only";

import { AuditAction, FileVisibility, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { FileMetadataInput } from "../file-schema";
import type { FileRecord, FileRepository } from "./file-policy";
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
  async list() {
    const files = await prisma.fileAsset.findMany({
      orderBy: { uploadedAt: "desc" },
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
        visibility: FileVisibility.PUBLIC,
      },
      select: fileSelect,
    });

    return file ? mapFile(file) : null;
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
            checksum: input.checksum,
            uploadedById: actorId,
            createdById: actorId,
            updatedById: actorId,
            uploadedAt: new Date(),
          },
          select: fileSelect,
        });

        await transaction.auditLog.create({
          data: {
            action: AuditAction.UPLOAD,
            targetResource: "FileAsset",
            targetId: created.id,
            summary: "File uploaded.",
            actorId,
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

  async updateMetadata(id, input: FileMetadataInput, actorId) {
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
        },
        select: fileSelect,
      });

      await transaction.auditLog.create({
        data: {
          action:
            current.visibility !== input.visibility
              ? input.visibility === FileVisibility.PUBLIC
                ? AuditAction.ENABLE
                : AuditAction.DISABLE
              : AuditAction.UPDATE,
          targetResource: "FileAsset",
          targetId: id,
          summary: "File metadata updated.",
          actorId,
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
      await transaction.auditLog.create({
        data: {
          action: AuditAction.DELETE_FILE,
          targetResource: "FileAsset",
          targetId: id,
          summary: "File deleted.",
          actorId,
        },
      });
    });
  },
};
