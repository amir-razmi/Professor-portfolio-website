import "server-only";

import { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/server/auth/access-control";
import { Permission, type AuthorizationPrincipal } from "@/server/auth/permissions";

import type { AuditLogQuery } from "./audit-log-schema";

const PAGE_SIZE = 25;

export type AuditLogRecord = {
  id: string;
  action: AuditAction;
  targetResource: string;
  targetId: string | null;
  summary: string | null;
  metadata: Prisma.JsonValue | null;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  createdAt: Date;
};

export type AuditLogPage = {
  items: AuditLogRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const auditLogSelect = {
  id: true,
  action: true,
  targetResource: true,
  targetId: true,
  summary: true,
  metadata: true,
  actorId: true,
  createdAt: true,
  actor: {
    select: {
      displayName: true,
      email: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

type AuditLogPayload = Prisma.AuditLogGetPayload<{ select: typeof auditLogSelect }>;

function mapAuditLog(log: AuditLogPayload): AuditLogRecord {
  return {
    id: log.id,
    action: log.action,
    targetResource: log.targetResource,
    targetId: log.targetId,
    summary: log.summary,
    metadata: log.metadata,
    actorId: log.actorId,
    actorName: log.actor?.displayName ?? "Unknown administrator",
    actorEmail: log.actor?.email ?? null,
    createdAt: log.createdAt,
  };
}

export async function listAuditLogsForActor(
  actor: AuthorizationPrincipal | null,
  query: AuditLogQuery = { page: 1 },
): Promise<AuditLogPage> {
  assertPermission(actor, Permission.VIEW_AUDIT_LOGS);
  const page = Math.max(query.page, 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.targetResource ? { targetResource: query.targetResource } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: auditLogSelect,
    }),
  ]);

  return {
    items: items.map(mapAuditLog),
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / PAGE_SIZE),
  };
}

export { AuditAction };
