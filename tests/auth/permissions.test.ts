import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole } from "@prisma/client";

import { assertAnyRole, assertPermission, assertRole } from "../../src/server/auth/access-control";
import { ForbiddenError, UnauthorizedError } from "../../src/server/auth/authorization-error";
import {
  Permission,
  getPermissionsForRole,
  hasPermission,
} from "../../src/server/auth/permissions";

const users = {
  superAdmin: {
    id: "507f1f77bcf86cd799439011",
    role: AdminRole.SUPER_ADMIN,
  },
  admin: {
    id: "507f1f77bcf86cd799439012",
    role: AdminRole.ADMIN,
  },
  editor: {
    id: "507f1f77bcf86cd799439013",
    role: AdminRole.EDITOR,
  },
};

test("SUPER_ADMIN receives every centralized permission", () => {
  for (const permission of Object.values(Permission)) {
    assert.equal(hasPermission(users.superAdmin, permission), true);
  }

  assert.deepEqual(
    new Set(getPermissionsForRole(AdminRole.SUPER_ADMIN)),
    new Set(Object.values(Permission)),
  );
});

test("ADMIN can manage content and files but not administrators or critical settings", () => {
  const allowed = [
    Permission.MANAGE_PROFESSOR_PROFILE,
    Permission.MANAGE_SITE_SETTINGS,
    Permission.MANAGE_RESEARCH,
    Permission.MANAGE_PUBLICATIONS,
    Permission.MANAGE_BLOG_POSTS,
    Permission.PUBLISH_BLOG_POSTS,
    Permission.MANAGE_FILES,
  ];
  const denied = [
    Permission.MANAGE_ADMINISTRATORS,
    Permission.MANAGE_PERMISSIONS,
    Permission.MANAGE_AUTHENTICATION_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
  ];

  for (const permission of allowed) {
    assert.equal(hasPermission(users.admin, permission), true);
  }

  for (const permission of denied) {
    assert.equal(hasPermission(users.admin, permission), false);
  }
});

test("EDITOR can edit blog posts but cannot publish or manage other resources", () => {
  assert.equal(hasPermission(users.editor, Permission.MANAGE_BLOG_POSTS), true);
  assert.equal(hasPermission(users.editor, Permission.PUBLISH_BLOG_POSTS), false);

  for (const permission of Object.values(Permission)) {
    if (permission !== Permission.MANAGE_BLOG_POSTS) {
      assert.equal(hasPermission(users.editor, permission), false);
    }
  }
});

test("central assertions distinguish unauthenticated and forbidden access", () => {
  assert.throws(() => assertPermission(null, Permission.MANAGE_BLOG_POSTS), UnauthorizedError);
  assert.throws(() => assertPermission(users.editor, Permission.MANAGE_FILES), ForbiddenError);
  assert.equal(assertRole(users.admin, AdminRole.ADMIN), users.admin);
  assert.equal(assertAnyRole(users.editor, [AdminRole.ADMIN, AdminRole.EDITOR]), users.editor);
  assert.throws(
    () => assertAnyRole(users.editor, [AdminRole.SUPER_ADMIN, AdminRole.ADMIN]),
    ForbiddenError,
  );
});
