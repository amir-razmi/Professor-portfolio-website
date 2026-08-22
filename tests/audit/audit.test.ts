import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole, AuditAction } from "@prisma/client";

import {
  sanitizeAuditMetadata,
  writeAuditLog,
  type AuditLogWriter,
} from "../../src/server/audit/audit-policy";
import { Permission, hasPermission } from "../../src/server/auth/permissions";

function createWriter() {
  const calls: Array<{ data: Record<string, unknown> }> = [];
  const writer: AuditLogWriter = {
    auditLog: {
      create: async ({ data }) => {
        calls.push({ data: data as Record<string, unknown> });
      },
    },
  };

  return { writer, calls };
}

test("audit metadata removes passwords, hashes, tokens, sessions, and secrets", () => {
  const metadata = sanitizeAuditMetadata({
    role: AdminRole.ADMIN,
    password: "do-not-store",
    passwordHash: "$2b$12$do-not-store",
    accessToken: "do-not-store",
    session: { value: "do-not-store" },
    safe: { changed: true },
  });

  assert.deepEqual(metadata, {
    role: AdminRole.ADMIN,
    safe: { changed: true },
  });
});

test("representative administrative events identify actor, action, and target", async () => {
  const { writer, calls } = createWriter();
  const actorId = "507f1f77bcf86cd799439011";
  const events = [
    [AuditAction.CREATE, "AdminUser"],
    [AuditAction.DISABLE, "AdminUser"],
    [AuditAction.PUBLISH, "BlogPost"],
    [AuditAction.DELETE, "BlogPost"],
    [AuditAction.UPLOAD, "FileAsset"],
    [AuditAction.DELETE_FILE, "FileAsset"],
    [AuditAction.UPDATE, "ProfessorProfile"],
    [AuditAction.UPDATE, "SiteSettings"],
    [AuditAction.UPDATE, "ResearchItem"],
    [AuditAction.UPDATE, "Publication"],
  ] as const;

  for (const [action, targetResource] of events) {
    await writeAuditLog(writer, {
      actorId,
      action,
      targetResource,
      targetId: "507f1f77bcf86cd799439012",
      summary: "Safe administrative event.",
      metadata: { changed: true },
    });
  }

  assert.equal(calls.length, events.length);
  assert.equal(calls[0]?.data.actorId, actorId);
  assert.equal(calls[0]?.data.action, AuditAction.CREATE);
  assert.equal(calls[0]?.data.targetResource, "AdminUser");
  assert.deepEqual(calls[0]?.data.metadata, { changed: true });
});

test("system bootstrap events can omit an actor without storing sensitive metadata", async () => {
  const { writer, calls } = createWriter();

  await writeAuditLog(writer, {
    actorId: null,
    action: AuditAction.CREATE,
    targetResource: "AdminUser",
    targetId: "507f1f77bcf86cd799439012",
    summary: "Initial administrator bootstrap.",
    metadata: {
      bootstrap: true,
      password: "never-store",
    },
  });

  assert.equal(calls[0]?.data.actorId, null);
  assert.deepEqual(calls[0]?.data.metadata, { bootstrap: true });
});

test("audit persistence failures do not break the primary operation", async () => {
  const writer: AuditLogWriter = {
    auditLog: {
      create: async () => {
        throw new Error("audit database unavailable");
      },
    },
  };

  await assert.doesNotReject(() =>
    writeAuditLog(writer, {
      actorId: "507f1f77bcf86cd799439011",
      action: AuditAction.UPDATE,
      targetResource: "SiteSettings",
      summary: "Settings updated.",
    }),
  );
});

test("only principals with VIEW_AUDIT_LOGS can use the audit viewer", () => {
  assert.equal(
    hasPermission(
      { id: "507f1f77bcf86cd799439011", role: AdminRole.SUPER_ADMIN },
      Permission.VIEW_AUDIT_LOGS,
    ),
    true,
  );
  assert.equal(
    hasPermission(
      { id: "507f1f77bcf86cd799439012", role: AdminRole.ADMIN },
      Permission.VIEW_AUDIT_LOGS,
    ),
    false,
  );
  assert.equal(
    hasPermission(
      { id: "507f1f77bcf86cd799439013", role: AdminRole.EDITOR },
      Permission.VIEW_AUDIT_LOGS,
    ),
    false,
  );
});
