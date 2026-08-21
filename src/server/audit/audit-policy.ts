import type { AuditAction, Prisma } from "@prisma/client";

const sensitiveKeyPattern =
  /(pass(word|hash)?|token|secret|session|cookie|authorization|credential|api[-_]?key|private[-_]?key)/i;

export type AuditMetadataValue =
  string | number | boolean | null | AuditMetadataValue[] | { [key: string]: AuditMetadataValue };

export type AuditMetadata = Record<string, AuditMetadataValue>;

export type AuditLogInput = {
  actorId: string;
  action: AuditAction;
  targetResource: string;
  targetId?: string | null;
  summary?: string | null;
  metadata?: unknown;
};

export type AuditLogWriter = {
  auditLog: {
    create: (args: Prisma.AuditLogCreateArgs) => Promise<unknown>;
  };
};

function sanitizeValue(value: unknown, depth: number): AuditMetadataValue | undefined {
  if (depth > 4) {
    return undefined;
  }

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return typeof value === "string" ? value.slice(0, 500) : value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item): item is AuditMetadataValue => item !== undefined);
  }

  if (typeof value !== "object") {
    return undefined;
  }

  const output: Record<string, AuditMetadataValue> = {};

  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKeyPattern.test(key)) {
      continue;
    }

    const safeKey = key.trim().slice(0, 80);
    if (!safeKey) {
      continue;
    }

    const sanitized = sanitizeValue(item, depth + 1);
    if (sanitized !== undefined) {
      output[safeKey] = sanitized;
    }
  }

  return output;
}

export function sanitizeAuditMetadata(input: unknown): AuditMetadata | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const sanitized = sanitizeValue(input, 0);
  if (!sanitized || Array.isArray(sanitized) || typeof sanitized !== "object") {
    return undefined;
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

/**
 * Writes an audit event without allowing audit persistence failures to interrupt
 * the primary operation. Callers may pass a Prisma transaction client so the
 * event is committed with the mutation when the database supports it.
 */
export async function writeAuditLog(writer: AuditLogWriter, input: AuditLogInput): Promise<void> {
  const metadata = sanitizeAuditMetadata(input.metadata);

  try {
    await writer.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetResource: input.targetResource,
        targetId: input.targetId ?? null,
        summary: input.summary ?? null,
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });
  } catch {
    // Auditing is best-effort by design. Do not make a successful content
    // mutation fail because the audit collection is temporarily unavailable.
  }
}
