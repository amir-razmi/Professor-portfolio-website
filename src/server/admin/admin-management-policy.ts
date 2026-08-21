import { AdminAccountStatus, AdminRole } from "@prisma/client";
import { z } from "zod";

import { assertRole } from "@/server/auth/access-control";
import {
  ForbiddenError,
  getAuthorizationFailure,
  type AuthorizationFailure,
} from "@/server/auth/authorization-error";
import type { AuthorizationPrincipal } from "@/server/auth/permissions";
import { adminPasswordSchema, hashPassword } from "@/server/auth/password";
import type { FieldErrors } from "@/server/content/content-errors";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const displayNameSchema = z.string().trim().min(1).max(120);
const roleSchema = z.enum([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]);
const statusSchema = z.enum([
  AdminAccountStatus.INVITED,
  AdminAccountStatus.ACTIVE,
  AdminAccountStatus.SUSPENDED,
  AdminAccountStatus.DISABLED,
]);

export const administratorIdSchema = objectIdSchema;
export const administratorRoleSchema = roleSchema;
export const administratorStatusSchema = statusSchema;

export const createAdministratorInputSchema = z
  .object({
    email: emailSchema,
    displayName: displayNameSchema,
    role: roleSchema,
    status: statusSchema.default(AdminAccountStatus.ACTIVE),
    password: adminPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: "custom",
        path: ["passwordConfirmation"],
        message: "Passwords do not match.",
      });
    }
  });

export const updateAdministratorDetailsInputSchema = z.object({
  targetAdminId: objectIdSchema,
  email: emailSchema,
  displayName: displayNameSchema,
});

export const setAdministratorStatusInputSchema = z.object({
  targetAdminId: objectIdSchema,
  status: statusSchema,
});

export const resetAdministratorPasswordInputSchema = z
  .object({
    targetAdminId: objectIdSchema,
    password: adminPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: "custom",
        path: ["passwordConfirmation"],
        message: "Passwords do not match.",
      });
    }
  });

export type CreateAdministratorInput = z.infer<typeof createAdministratorInputSchema>;
export type UpdateAdministratorDetailsInput = z.infer<typeof updateAdministratorDetailsInputSchema>;
export type SetAdministratorStatusInput = z.infer<typeof setAdministratorStatusInputSchema>;
export type ResetAdministratorPasswordInput = z.infer<typeof resetAdministratorPasswordInputSchema>;

export type AdministratorRecord = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminAccountStatus;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdministratorMutationResult = AdministratorRecord & {
  changed: boolean;
};

export type AdministratorManagementStore = {
  listAdministrators: () => Promise<AdministratorRecord[]>;
  findAdministratorById: (id: string) => Promise<AdministratorRecord | null>;
  countActiveSuperAdmins?: () => Promise<number>;
  createAdministrator: (input: {
    actor: AuthorizationPrincipal;
    data: CreateAdministratorInput;
    passwordHash: string;
  }) => Promise<AdministratorRecord>;
  updateAdministratorDetails: (input: {
    actor: AuthorizationPrincipal;
    target: AdministratorRecord;
    data: UpdateAdministratorDetailsInput;
  }) => Promise<AdministratorRecord>;
  setAdministratorStatus: (input: {
    actor: AuthorizationPrincipal;
    target: AdministratorRecord;
    status: AdminAccountStatus;
    isActive: boolean;
  }) => Promise<AdministratorRecord>;
  resetAdministratorPassword: (input: {
    actor: AuthorizationPrincipal;
    target: AdministratorRecord;
    passwordHash: string;
  }) => Promise<AdministratorRecord>;
};

export const AdminManagementErrorCode = {
  INVALID_INPUT: "INVALID_INPUT",
  ADMIN_NOT_FOUND: "ADMIN_NOT_FOUND",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  SELF_DEACTIVATION: "SELF_DEACTIVATION",
  LAST_SUPER_ADMIN: "LAST_SUPER_ADMIN",
} as const;

export type AdminManagementErrorCode =
  (typeof AdminManagementErrorCode)[keyof typeof AdminManagementErrorCode];

export class AdminManagementError extends Error {
  readonly code: AdminManagementErrorCode;
  readonly status: 400 | 403 | 404 | 409;
  readonly fieldErrors: FieldErrors;

  constructor(
    code: AdminManagementErrorCode,
    message: string,
    status: 400 | 403 | 404 | 409,
    fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "AdminManagementError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type AdminManagementFailure =
  | AuthorizationFailure
  | {
      code: AdminManagementErrorCode;
      message: string;
      status: 400 | 403 | 404 | 409;
      fieldErrors: FieldErrors;
    };

export function getAdminManagementFailure(error: unknown): AdminManagementFailure | null {
  const authorizationFailure = getAuthorizationFailure(error);

  if (authorizationFailure) {
    return authorizationFailure;
  }

  if (!(error instanceof AdminManagementError)) {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    status: error.status,
    fieldErrors: error.fieldErrors,
  };
}

function assertSuperAdmin(actor: AuthorizationPrincipal | null): AuthorizationPrincipal {
  return assertRole(actor, AdminRole.SUPER_ADMIN);
}

function invalidInput(message: string, fieldErrors: FieldErrors = {}): never {
  throw new AdminManagementError(AdminManagementErrorCode.INVALID_INPUT, message, 400, fieldErrors);
}

function parseInput<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    invalidInput(message, parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

async function findTarget(
  store: AdministratorManagementStore,
  targetAdminId: string,
): Promise<AdministratorRecord> {
  const target = await store.findAdministratorById(targetAdminId);

  if (!target) {
    throw new AdminManagementError(
      AdminManagementErrorCode.ADMIN_NOT_FOUND,
      "Administrator account not found.",
      404,
    );
  }

  return target;
}

async function assertCanDeactivateSuperAdmin(
  target: AdministratorRecord,
  actor: AuthorizationPrincipal,
  store: AdministratorManagementStore,
): Promise<void> {
  if (
    target.role !== AdminRole.SUPER_ADMIN ||
    !target.isActive ||
    target.status !== AdminAccountStatus.ACTIVE
  ) {
    return;
  }

  if (target.id === actor.id) {
    throw new ForbiddenError();
  }

  if (!store.countActiveSuperAdmins) {
    throw new ForbiddenError();
  }

  const activeSuperAdminCount = await store.countActiveSuperAdmins();

  if (activeSuperAdminCount <= 1) {
    throw new AdminManagementError(
      AdminManagementErrorCode.LAST_SUPER_ADMIN,
      "The last active SUPER_ADMIN cannot be deactivated.",
      403,
    );
  }
}

export async function listAdministratorsForActor(
  actor: AuthorizationPrincipal | null,
  store: AdministratorManagementStore,
): Promise<AdministratorRecord[]> {
  assertSuperAdmin(actor);
  return store.listAdministrators();
}

export async function getAdministratorForActor(
  actor: AuthorizationPrincipal | null,
  targetAdminId: unknown,
  store: AdministratorManagementStore,
): Promise<AdministratorRecord | null> {
  assertSuperAdmin(actor);
  const id = parseInput(objectIdSchema, targetAdminId, "The administrator id is invalid.");
  return store.findAdministratorById(id);
}

export async function countActiveSuperAdminsForActor(
  actor: AuthorizationPrincipal | null,
  store: AdministratorManagementStore,
): Promise<number> {
  assertSuperAdmin(actor);

  if (!store.countActiveSuperAdmins) {
    throw new Error("The administrator store does not support active SUPER_ADMIN counts.");
  }

  return store.countActiveSuperAdmins();
}

export async function createAdministratorForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  store: AdministratorManagementStore,
): Promise<AdministratorRecord> {
  const authorizedActor = assertSuperAdmin(actor);
  const parsed = parseInput(
    createAdministratorInputSchema,
    input,
    "Review the highlighted administrator fields.",
  );
  const passwordHash = await hashPassword(parsed.password);

  return store.createAdministrator({
    actor: authorizedActor,
    data: parsed,
    passwordHash,
  });
}

export async function updateAdministratorDetailsForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  store: AdministratorManagementStore,
): Promise<AdministratorRecord> {
  const authorizedActor = assertSuperAdmin(actor);
  const parsed = parseInput(
    updateAdministratorDetailsInputSchema,
    input,
    "Review the highlighted administrator fields.",
  );
  const target = await findTarget(store, parsed.targetAdminId);

  return store.updateAdministratorDetails({
    actor: authorizedActor,
    target,
    data: parsed,
  });
}

export async function setAdministratorStatusForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  store: AdministratorManagementStore,
): Promise<AdministratorMutationResult> {
  const authorizedActor = assertSuperAdmin(actor);
  const parsed = parseInput(
    setAdministratorStatusInputSchema,
    input,
    "Review the highlighted account status.",
  );
  const target = await findTarget(store, parsed.targetAdminId);
  const isActive = parsed.status === AdminAccountStatus.ACTIVE;

  if (!isActive && target.id === authorizedActor.id) {
    throw new AdminManagementError(
      AdminManagementErrorCode.SELF_DEACTIVATION,
      "You cannot deactivate your own administrator account.",
      403,
    );
  }

  if (!isActive) {
    await assertCanDeactivateSuperAdmin(target, authorizedActor, store);
  }

  if (target.status === parsed.status && target.isActive === isActive) {
    return {
      ...target,
      changed: false,
    };
  }

  const updated = await store.setAdministratorStatus({
    actor: authorizedActor,
    target,
    status: parsed.status,
    isActive,
  });

  return {
    ...updated,
    changed: true,
  };
}

export async function resetAdministratorPasswordForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  store: AdministratorManagementStore,
): Promise<AdministratorRecord> {
  const authorizedActor = assertSuperAdmin(actor);
  const parsed = parseInput(
    resetAdministratorPasswordInputSchema,
    input,
    "Review the password fields.",
  );
  const target = await findTarget(store, parsed.targetAdminId);
  const passwordHash = await hashPassword(parsed.password);

  return store.resetAdministratorPassword({
    actor: authorizedActor,
    target,
    passwordHash,
  });
}
