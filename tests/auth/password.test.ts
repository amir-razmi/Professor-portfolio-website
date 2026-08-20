import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "../../src/server/auth/password";

test("hashPassword stores a bcrypt hash and verifies the original password", async () => {
  const password = "development-password-123";
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^\$2[aby]\$/);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword("another-password-456", passwordHash), false);
});

test("verifyPassword safely rejects missing or malformed hashes", async () => {
  assert.equal(await verifyPassword("development-password-123", null), false);
  assert.equal(await verifyPassword("development-password-123", "not-a-bcrypt-hash"), false);
});
