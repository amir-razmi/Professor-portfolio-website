import assert from "node:assert/strict";
import test from "node:test";

import { AdminAccountStatus, AdminRole } from "@prisma/client";

import {
  AdminManagementError,
  AdminManagementErrorCode,
  createAdministratorForActor,
  resetAdministratorPasswordForActor,
  setAdministratorStatusForActor,
  type AdministratorManagementStore,
  type AdministratorRecord,
} from "../../src/server/admin/admin-management-policy";
import { executeCreateAdministratorAction } from "../../src/server/admin/admin-management-action-handler";
import { initialAdminManagementActionState } from "../../src/features/admin-management/admin-action-state";
import {
  changeAdminRoleForActor,
  type AdminRoleChangeStore,
} from "../../src/server/admin/admin-role-policy";
import { ForbiddenError, UnauthorizedError } from "../../src/server/auth/authorization-error";
import { verifyPassword } from "../../src/server/auth/password";

const superAdmin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.SUPER_ADMIN,
};
const secondSuperAdmin = {
  id: "507f1f77bcf86cd799439012",
  role: AdminRole.SUPER_ADMIN,
};
const administrator = {
  id: "507f1f77bcf86cd799439013",
  role: AdminRole.ADMIN,
};
const editor = {
  id: "507f1f77bcf86cd799439014",
  role: AdminRole.EDITOR,
};

function record(
  principal: { id: string; role: AdminRole },
  overrides: Partial<AdministratorRecord> = {},
): AdministratorRecord {
  const now = new Date("2026-08-21T00:00:00.000Z");

  return {
    id: principal.id,
    email: `${principal.role.toLowerCase()}-${principal.id.slice(-2)}@example.test`,
    displayName: principal.role,
    role: principal.role,
    status: AdminAccountStatus.ACTIVE,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createStore(initial: AdministratorRecord[] = [record(superAdmin), record(administrator)]) {
  const records = new Map(initial.map((item) => [item.id, item]));
  let createdPasswordHash: string | null = null;

  const store: AdministratorManagementStore = {
    listAdministrators: async () => [...records.values()],
    findAdministratorById: async (id) => records.get(id) ?? null,
    countActiveSuperAdmins: async () =>
      [...records.values()].filter(
        (item) =>
          item.role === AdminRole.SUPER_ADMIN &&
          item.status === AdminAccountStatus.ACTIVE &&
          item.isActive,
      ).length,
    createAdministrator: async ({ data, passwordHash }) => {
      createdPasswordHash = passwordHash;
      const now = new Date();
      const created = record(
        { id: "507f1f77bcf86cd799439099", role: data.role },
        {
          email: data.email,
          displayName: data.displayName,
          status: data.status,
          isActive: data.status === AdminAccountStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
      );
      records.set(created.id, created);
      return created;
    },
    updateAdministratorDetails: async ({ target, data }) => {
      const updated = { ...target, email: data.email, displayName: data.displayName };
      records.set(target.id, updated);
      return updated;
    },
    setAdministratorStatus: async ({ target, status, isActive }) => {
      const updated = { ...target, status, isActive };
      records.set(target.id, updated);
      return updated;
    },
    resetAdministratorPassword: async ({ target, passwordHash }) => {
      createdPasswordHash = passwordHash;
      return target;
    },
  };

  return {
    store,
    getCreatedPasswordHash: () => createdPasswordHash,
  };
}

test("SUPER_ADMIN can create an administrator and only a hash reaches storage", async () => {
  const fixture = createStore();
  const plaintext = "DevelopmentPassword123!";

  const created = await createAdministratorForActor(
    superAdmin,
    {
      email: "new-admin@example.test",
      displayName: "New Administrator",
      role: AdminRole.EDITOR,
      status: AdminAccountStatus.ACTIVE,
      password: plaintext,
      passwordConfirmation: plaintext,
    },
    fixture.store,
  );

  assert.equal(created.email, "new-admin@example.test");
  assert.notEqual(fixture.getCreatedPasswordHash(), plaintext);
  assert.ok(fixture.getCreatedPasswordHash());
  assert.equal(await verifyPassword(plaintext, fixture.getCreatedPasswordHash()), true);
});

test("administrator management rejects unauthenticated and non-SUPER_ADMIN actors", async () => {
  const fixture = createStore();
  const input = {
    email: "new-admin@example.test",
    displayName: "New Administrator",
    role: AdminRole.EDITOR,
    status: AdminAccountStatus.ACTIVE,
    password: "DevelopmentPassword123!",
    passwordConfirmation: "DevelopmentPassword123!",
  };

  await assert.rejects(
    () => createAdministratorForActor(null, input, fixture.store),
    UnauthorizedError,
  );
  await assert.rejects(
    () => createAdministratorForActor(administrator, input, fixture.store),
    ForbiddenError,
  );
});

test("SUPER_ADMIN can deactivate and reactivate another administrator", async () => {
  const fixture = createStore();

  const deactivated = await setAdministratorStatusForActor(
    superAdmin,
    { targetAdminId: administrator.id, status: AdminAccountStatus.DISABLED },
    fixture.store,
  );
  assert.equal(deactivated.changed, true);
  assert.equal(deactivated.isActive, false);
  assert.equal(deactivated.status, AdminAccountStatus.DISABLED);

  const reactivated = await setAdministratorStatusForActor(
    superAdmin,
    { targetAdminId: administrator.id, status: AdminAccountStatus.ACTIVE },
    fixture.store,
  );
  assert.equal(reactivated.changed, true);
  assert.equal(reactivated.isActive, true);
  assert.equal(reactivated.status, AdminAccountStatus.ACTIVE);
});

test("an administrator cannot deactivate their own account", async () => {
  const fixture = createStore([record(superAdmin)]);

  await assert.rejects(
    () =>
      setAdministratorStatusForActor(
        superAdmin,
        { targetAdminId: superAdmin.id, status: AdminAccountStatus.DISABLED },
        fixture.store,
      ),
    (error: unknown) =>
      error instanceof AdminManagementError &&
      error.code === AdminManagementErrorCode.SELF_DEACTIVATION,
  );
});

test("the last active SUPER_ADMIN cannot be deactivated", async () => {
  const fixture = createStore([
    record(superAdmin),
    record(secondSuperAdmin, {
      status: AdminAccountStatus.DISABLED,
      isActive: false,
    }),
  ]);

  await assert.rejects(
    () =>
      setAdministratorStatusForActor(
        secondSuperAdmin,
        { targetAdminId: superAdmin.id, status: AdminAccountStatus.DISABLED },
        fixture.store,
      ),
    (error: unknown) =>
      error instanceof AdminManagementError &&
      error.code === AdminManagementErrorCode.LAST_SUPER_ADMIN,
  );

  const otherSuper = createStore([record(superAdmin), record(secondSuperAdmin)]);
  const demoted = await setAdministratorStatusForActor(
    superAdmin,
    { targetAdminId: secondSuperAdmin.id, status: AdminAccountStatus.DISABLED },
    otherSuper.store,
  );
  assert.equal(demoted.isActive, false);
});

test("role changes cannot demote the last active SUPER_ADMIN or change the actor's own role", async () => {
  const target = record(superAdmin);
  const store: AdminRoleChangeStore = {
    findAdminById: async () => target,
    countActiveSuperAdmins: async () => 1,
    updateAdminRole: async () => target,
  };

  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        superAdmin,
        { targetAdminId: target.id, role: AdminRole.ADMIN },
        store,
      ),
    ForbiddenError,
  );

  const multiStore: AdminRoleChangeStore = {
    findAdminById: async (id) => (id === superAdmin.id ? record(superAdmin) : null),
    countActiveSuperAdmins: async () => 2,
    updateAdminRole: async ({ target: currentTarget, role }) => ({ ...currentTarget, role }),
  };
  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        superAdmin,
        { targetAdminId: superAdmin.id, role: AdminRole.ADMIN },
        multiStore,
      ),
    ForbiddenError,
  );
});

test("password reset hashes the replacement password and never returns the hash", async () => {
  const fixture = createStore();
  const plaintext = "AnotherDevelopmentPassword123!";

  const result = await resetAdministratorPasswordForActor(
    superAdmin,
    {
      targetAdminId: administrator.id,
      password: plaintext,
      passwordConfirmation: plaintext,
    },
    fixture.store,
  );

  assert.equal(result.id, administrator.id);
  assert.notEqual(fixture.getCreatedPasswordHash(), plaintext);
  assert.equal(await verifyPassword(plaintext, fixture.getCreatedPasswordHash()), true);
});

test("protected create action does not call mutation dependencies when authorization fails", async () => {
  const formData = new FormData();
  formData.set("email", "new-admin@example.test");
  let createCalls = 0;

  const state = await executeCreateAdministratorAction(
    initialAdminManagementActionState,
    formData,
    {
      authorizeActor: async () => {
        throw new UnauthorizedError();
      },
      create: async () => {
        createCalls += 1;
        return record(editor);
      },
      updateDetails: async () => record(editor),
      setStatus: async () => ({ ...record(editor), changed: true }),
      resetPassword: async () => record(editor),
    },
  );

  assert.equal(state.status, "error");
  assert.equal(state.message, "برای ادامه باید وارد شوید.");
  assert.equal(createCalls, 0);
});
