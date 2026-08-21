import "server-only";

import { AuditAction, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { writeAuditLog, type AuditLogInput } from "./audit-policy";

export type { AuditLogInput } from "./audit-policy";

export function recordAuditLog(input: AuditLogInput): Promise<void> {
  return writeAuditLog(prisma, input);
}

export function recordAuditLogInTransaction(
  transaction: Prisma.TransactionClient,
  input: AuditLogInput,
): Promise<void> {
  return writeAuditLog(transaction, input);
}

export function auditResourceChanged(
  actorId: string,
  targetResource: "ResearchItem" | "Publication",
  targetId: string,
  metadata?: unknown,
): Promise<void> {
  return recordAuditLog({
    actorId,
    action: AuditAction.UPDATE,
    targetResource,
    targetId,
    summary: `${targetResource} changed.`,
    metadata,
  });
}
