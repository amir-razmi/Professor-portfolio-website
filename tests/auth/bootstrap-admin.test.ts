import assert from "node:assert/strict";
import test from "node:test";

import { AdminAccountStatus, AdminRole } from "@prisma/client";

import {
  BootstrapAdminError,
  BootstrapAdminErrorCode,
  bootstrapSuperAdmin,
  parseBootstrapAdminEnvironment,
  type BootstrapAdminRecord,
  type BootstrapAdminStore,
} from "../../src/server/admin/bootstrap-admin";
import { verifyPassword } from "../../src/server/auth/password";

const password = "BootstrapPassword123!";

function record(overrides: Partial<BootstrapAdminRecord> = {}): BootstrapAdminRecord {
  return {
    id: "507f1f77bcf86cd799439011",
    email: "admin@example.test",
    displayName: "مدیر سامانه",
    role: AdminRole.SUPER_ADMIN,
    status: AdminAccountStatus.ACTIVE,
    isActive: true,
    ...overrides,
  };
}

function createStore(initial: BootstrapAdminRecord[] = []) {
  const records = new Map(initial.map((admin) => [admin.email, admin]));
  let createCalls = 0;
  let passwordHash: string | null = null;

  const store: BootstrapAdminStore = {
    findAdministratorByEmail: async (email) => records.get(email) ?? null,
    countActiveSuperAdmins: async () =>
      [...records.values()].filter(
        (admin) =>
          admin.role === AdminRole.SUPER_ADMIN &&
          admin.status === AdminAccountStatus.ACTIVE &&
          admin.isActive,
      ).length,
    createSuperAdmin: async ({ data, passwordHash: nextPasswordHash }) => {
      createCalls += 1;
      passwordHash = nextPasswordHash;

      const created = record({
        id: "507f1f77bcf86cd799439099",
        email: data.email,
        displayName: data.displayName,
      });
      records.set(created.email, created);
      return created;
    },
  };

  return {
    store,
    getCreateCalls: () => createCalls,
    getPasswordHash: () => passwordHash,
  };
}

test("bootstrap creates an active SUPER_ADMIN with a password hash", async () => {
  const fixture = createStore();

  const result = await bootstrapSuperAdmin(
    {
      email: " ADMIN@EXAMPLE.TEST ",
      displayName: "مدیر اصلی",
      password,
    },
    fixture.store,
  );

  assert.equal(result.created, true);
  assert.equal(result.admin.email, "admin@example.test");
  assert.equal(result.admin.role, AdminRole.SUPER_ADMIN);
  assert.equal(result.admin.status, AdminAccountStatus.ACTIVE);
  assert.equal(result.admin.isActive, true);
  assert.equal(fixture.getCreateCalls(), 1);
  assert.notEqual(fixture.getPasswordHash(), password);
  assert.equal(await verifyPassword(password, fixture.getPasswordHash()), true);
});

test("bootstrap is idempotent for the same active SUPER_ADMIN and never resets its password", async () => {
  const fixture = createStore([record()]);

  const result = await bootstrapSuperAdmin(
    {
      email: "admin@example.test",
      displayName: "A different name",
      password,
    },
    fixture.store,
  );

  assert.equal(result.created, false);
  assert.equal(result.reason, "ALREADY_CONFIGURED");
  assert.equal(fixture.getCreateCalls(), 0);
  assert.equal(fixture.getPasswordHash(), null);
});

test("bootstrap refuses to create a second SUPER_ADMIN", async () => {
  const fixture = createStore([
    record({
      email: "existing@example.test",
    }),
  ]);

  await assert.rejects(
    () =>
      bootstrapSuperAdmin(
        {
          email: "new@example.test",
          displayName: "مدیر جدید",
          password,
        },
        fixture.store,
      ),
    (error: unknown) =>
      error instanceof BootstrapAdminError &&
      error.code === BootstrapAdminErrorCode.ACTIVE_SUPER_ADMIN_EXISTS,
  );
  assert.equal(fixture.getCreateCalls(), 0);
});

test("bootstrap refuses an existing non-active or non-SUPER_ADMIN account", async () => {
  const fixture = createStore([
    record({
      email: "admin@example.test",
      role: AdminRole.ADMIN,
    }),
  ]);

  await assert.rejects(
    () =>
      bootstrapSuperAdmin(
        {
          email: "admin@example.test",
          displayName: "مدیر اصلی",
          password,
        },
        fixture.store,
      ),
    (error: unknown) =>
      error instanceof BootstrapAdminError &&
      error.code === BootstrapAdminErrorCode.EXISTING_ACCOUNT_CONFLICT,
  );
  assert.equal(fixture.getCreateCalls(), 0);
});

test("bootstrap environment parsing requires explicit confirmation and protects development databases", () => {
  const production = parseBootstrapAdminEnvironment({
    DATABASE_URL: "mongodb://mongodb:27017/academic_portfolio",
    DATABASE_ENV: "production",
    NODE_ENV: "production",
    BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
    BOOTSTRAP_ADMIN_NAME: "مدیر سامانه",
    BOOTSTRAP_ADMIN_PASSWORD: password,
    BOOTSTRAP_ADMIN_CONFIRMATION: "YES",
  });
  assert.equal(production.DATABASE_ENV, "production");

  const development = parseBootstrapAdminEnvironment({
    DATABASE_URL: "mongodb://127.0.0.1:27017/academic_portfolio_dev",
    DATABASE_ENV: "development",
    NODE_ENV: "development",
    BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
    BOOTSTRAP_ADMIN_NAME: "مدیر سامانه",
    BOOTSTRAP_ADMIN_PASSWORD: password,
    BOOTSTRAP_ADMIN_CONFIRMATION: "YES",
  });
  assert.equal(development.DATABASE_ENV, "development");

  assert.throws(
    () =>
      parseBootstrapAdminEnvironment({
        DATABASE_URL: "mongodb://mongodb:27017/academic_portfolio",
        DATABASE_ENV: "production",
        NODE_ENV: "production",
        BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
        BOOTSTRAP_ADMIN_NAME: "مدیر سامانه",
        BOOTSTRAP_ADMIN_PASSWORD: password,
        BOOTSTRAP_ADMIN_CONFIRMATION: "NO",
      }),
    (error: unknown) =>
      error instanceof BootstrapAdminError &&
      error.code === BootstrapAdminErrorCode.INVALID_ENVIRONMENT,
  );

  assert.throws(
    () =>
      parseBootstrapAdminEnvironment({
        DATABASE_URL: "mongodb://127.0.0.1:27017/academic_portfolio",
        DATABASE_ENV: "development",
        NODE_ENV: "development",
        BOOTSTRAP_ADMIN_EMAIL: "admin@example.test",
        BOOTSTRAP_ADMIN_NAME: "مدیر سامانه",
        BOOTSTRAP_ADMIN_PASSWORD: password,
        BOOTSTRAP_ADMIN_CONFIRMATION: "YES",
      }),
    (error: unknown) =>
      error instanceof BootstrapAdminError &&
      error.code === BootstrapAdminErrorCode.INVALID_ENVIRONMENT,
  );
});
