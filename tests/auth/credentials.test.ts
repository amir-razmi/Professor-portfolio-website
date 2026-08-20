import assert from "node:assert/strict";
import test from "node:test";

import { AdminAccountStatus } from "@prisma/client";

import {
  verifyAdminCredentials,
  type AdminCredentialRecord,
} from "../../src/server/auth/credentials";
import { hashPassword } from "../../src/server/auth/password";

const password = "development-password-123";

async function createAdmin(
  overrides: Partial<AdminCredentialRecord> = {},
): Promise<AdminCredentialRecord> {
  return {
    id: "507f1f77bcf86cd799439011",
    email: "admin@example.test",
    displayName: "Development Admin",
    passwordHash: await hashPassword(password),
    status: AdminAccountStatus.ACTIVE,
    isActive: true,
    ...overrides,
  };
}

test("verifyAdminCredentials returns only safe identity fields for an active admin", async () => {
  const admin = await createAdmin();
  let lookedUpEmail: string | undefined;
  let updatedAdminId: string | undefined;

  const result = await verifyAdminCredentials(
    { email: " ADMIN@EXAMPLE.TEST ", password },
    {
      findAdmin: async (email) => {
        lookedUpEmail = email;
        return admin;
      },
      updateLastLogin: async (adminId) => {
        updatedAdminId = adminId;
      },
    },
  );

  assert.deepEqual(result, {
    id: admin.id,
    email: admin.email,
    name: admin.displayName,
  });
  assert.equal(lookedUpEmail, admin.email);
  assert.equal(updatedAdminId, admin.id);
  assert.equal("passwordHash" in (result ?? {}), false);
  assert.equal("role" in (result ?? {}), false);
});

test("verifyAdminCredentials rejects wrong, inactive, and unknown accounts generically", async () => {
  const activeAdmin = await createAdmin();
  const findAdmin = async (email: string) => (email === activeAdmin.email ? activeAdmin : null);

  const wrongPassword = await verifyAdminCredentials(
    { email: activeAdmin.email, password: "wrong-development-password" },
    { findAdmin },
  );
  const inactiveAdmin = await verifyAdminCredentials(
    { email: activeAdmin.email, password },
    {
      findAdmin: async () =>
        createAdmin({
          status: AdminAccountStatus.SUSPENDED,
          isActive: false,
        }),
    },
  );
  const unknownAdmin = await verifyAdminCredentials(
    { email: "missing@example.test", password },
    { findAdmin },
  );
  const malformedInput = await verifyAdminCredentials(
    { email: "not-an-email", password: "short" },
    { findAdmin },
  );

  assert.equal(wrongPassword, null);
  assert.equal(inactiveAdmin, null);
  assert.equal(unknownAdmin, null);
  assert.equal(malformedInput, null);
});
