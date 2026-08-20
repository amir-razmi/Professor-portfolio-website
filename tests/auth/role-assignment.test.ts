import assert from "node:assert/strict";
import test from "node:test";

import { AdminRole } from "@prisma/client";

import {
  AdminRoleChangeError,
  AdminRoleChangeErrorCode,
  changeAdminRoleForActor,
  type AdminRoleChangeStore,
} from "../../src/server/admin/admin-role-policy";
import {
  executeChangeAdminRoleAction,
  type ChangeAdminRoleActionState,
} from "../../src/server/admin/change-admin-role-action-handler";
import { ForbiddenError, UnauthorizedError } from "../../src/server/auth/authorization-error";
import {
  RoleAssignmentDenialReason,
  canAssignRole,
  evaluateRoleAssignment,
} from "../../src/server/auth/permissions";

const superAdmin = {
  id: "507f1f77bcf86cd799439011",
  role: AdminRole.SUPER_ADMIN,
};
const admin = {
  id: "507f1f77bcf86cd799439012",
  role: AdminRole.ADMIN,
};
const editor = {
  id: "507f1f77bcf86cd799439013",
  role: AdminRole.EDITOR,
};
const targetEditor = {
  id: "507f1f77bcf86cd799439014",
  role: AdminRole.EDITOR,
};

function createStore(target = targetEditor) {
  let updateCalls = 0;

  const store: AdminRoleChangeStore = {
    findAdminById: async (adminId) => (adminId === target.id ? target : null),
    updateAdminRole: async ({ target: currentTarget, role }) => {
      updateCalls += 1;
      return {
        id: currentTarget.id,
        role,
      };
    },
  };

  return {
    store,
    getUpdateCalls: () => updateCalls,
  };
}

test("role assignment policy blocks self and upward privilege escalation", () => {
  assert.deepEqual(evaluateRoleAssignment(admin, admin, AdminRole.SUPER_ADMIN), {
    allowed: false,
    reason: RoleAssignmentDenialReason.SELF_ESCALATION,
  });
  assert.deepEqual(evaluateRoleAssignment(editor, admin, AdminRole.EDITOR), {
    allowed: false,
    reason: RoleAssignmentDenialReason.TARGET_OUTRANKS_ACTOR,
  });
  assert.deepEqual(evaluateRoleAssignment(admin, targetEditor, AdminRole.SUPER_ADMIN), {
    allowed: false,
    reason: RoleAssignmentDenialReason.ROLE_ESCALATION,
  });
  assert.equal(canAssignRole(superAdmin, targetEditor, AdminRole.ADMIN), true);
});

test("protected role service rejects unauthenticated and unauthorized actors before mutation", async () => {
  const unauthenticatedStore = createStore();
  const unauthorizedStore = createStore();

  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        null,
        {
          targetAdminId: targetEditor.id,
          role: AdminRole.ADMIN,
        },
        unauthenticatedStore.store,
      ),
    UnauthorizedError,
  );
  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        admin,
        {
          targetAdminId: targetEditor.id,
          role: AdminRole.ADMIN,
        },
        unauthorizedStore.store,
      ),
    ForbiddenError,
  );

  assert.equal(unauthenticatedStore.getUpdateCalls(), 0);
  assert.equal(unauthorizedStore.getUpdateCalls(), 0);
});

test("SUPER_ADMIN can change another administrator role and no-op changes avoid writes", async () => {
  const changedStore = createStore();
  const changed = await changeAdminRoleForActor(
    superAdmin,
    {
      targetAdminId: targetEditor.id,
      role: AdminRole.ADMIN,
    },
    changedStore.store,
  );

  assert.deepEqual(changed, {
    id: targetEditor.id,
    role: AdminRole.ADMIN,
    changed: true,
  });
  assert.equal(changedStore.getUpdateCalls(), 1);

  const noOpStore = createStore();
  const unchanged = await changeAdminRoleForActor(
    superAdmin,
    {
      targetAdminId: targetEditor.id,
      role: AdminRole.EDITOR,
    },
    noOpStore.store,
  );

  assert.deepEqual(unchanged, {
    ...targetEditor,
    changed: false,
  });
  assert.equal(noOpStore.getUpdateCalls(), 0);
});

test("role service validates input and reports missing targets after authorization", async () => {
  const store = createStore();

  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        superAdmin,
        {
          targetAdminId: "invalid-id",
          role: AdminRole.ADMIN,
        },
        store.store,
      ),
    (error: unknown) =>
      error instanceof AdminRoleChangeError &&
      error.code === AdminRoleChangeErrorCode.INVALID_REQUEST,
  );
  await assert.rejects(
    () =>
      changeAdminRoleForActor(
        superAdmin,
        {
          targetAdminId: "507f1f77bcf86cd799439099",
          role: AdminRole.ADMIN,
        },
        store.store,
      ),
    (error: unknown) =>
      error instanceof AdminRoleChangeError &&
      error.code === AdminRoleChangeErrorCode.ADMIN_NOT_FOUND,
  );
});

test("protected server action handler returns unauthorized and forbidden states without mutation", async () => {
  const initialState: ChangeAdminRoleActionState = {
    ok: false,
    code: "INITIAL",
    message: "",
  };
  const formData = new FormData();
  formData.set("targetAdminId", targetEditor.id);
  formData.set("role", AdminRole.ADMIN);
  let changeCalls = 0;

  const unauthorized = await executeChangeAdminRoleAction(initialState, formData, {
    authorizeActor: async () => {
      throw new UnauthorizedError();
    },
    changeRole: async () => {
      changeCalls += 1;
      return {
        ...targetEditor,
        changed: true,
      };
    },
  });
  const forbidden = await executeChangeAdminRoleAction(initialState, formData, {
    authorizeActor: async () => {
      throw new ForbiddenError();
    },
    changeRole: async () => {
      changeCalls += 1;
      return {
        ...targetEditor,
        changed: true,
      };
    },
  });

  assert.deepEqual(unauthorized, {
    ok: false,
    code: "UNAUTHORIZED",
    message: "Authentication required.",
  });
  assert.deepEqual(forbidden, {
    ok: false,
    code: "FORBIDDEN",
    message: "Insufficient permissions.",
  });
  assert.equal(changeCalls, 0);
});
