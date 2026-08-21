import { AdminAccountStatus, AdminRole } from "@prisma/client";
import { z } from "zod";

import { assertPermission, assertRole } from "@/server/auth/access-control";
import {
  ForbiddenError,
  getAuthorizationFailure,
  type AuthorizationFailure,
} from "@/server/auth/authorization-error";
import {
  Permission,
  evaluateRoleAssignment,
  type AuthorizationPrincipal,
} from "@/server/auth/permissions";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const adminRoleSchema = z.enum([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]);

export const changeAdminRoleInputSchema = z.object({
  targetAdminId: objectIdSchema,
  role: adminRoleSchema,
});

export type ChangeAdminRoleInput = z.infer<typeof changeAdminRoleInputSchema>;

export type AdminRoleRecord = {
  id: string;
  role: AdminRole;
  isActive?: boolean;
  status?: AdminAccountStatus;
};

export type AdminRoleChangeResult = AdminRoleRecord & {
  changed: boolean;
};

export type AdminRoleChangeStore = {
  findAdminById: (adminId: string) => Promise<AdminRoleRecord | null>;
  countActiveSuperAdmins?: () => Promise<number>;
  updateAdminRole: (input: {
    actor: AuthorizationPrincipal;
    target: AdminRoleRecord;
    role: AdminRole;
  }) => Promise<AdminRoleRecord>;
};

export const AdminRoleChangeErrorCode = {
  INVALID_REQUEST: "INVALID_REQUEST",
  ADMIN_NOT_FOUND: "ADMIN_NOT_FOUND",
} as const;

export type AdminRoleChangeErrorCode =
  (typeof AdminRoleChangeErrorCode)[keyof typeof AdminRoleChangeErrorCode];

export class AdminRoleChangeError extends Error {
  readonly code: AdminRoleChangeErrorCode;
  readonly status: 400 | 404;

  constructor(code: AdminRoleChangeErrorCode, message: string, status: 400 | 404) {
    super(message);
    this.name = "AdminRoleChangeError";
    this.code = code;
    this.status = status;
  }
}

export type AdminRoleChangeFailure =
  | AuthorizationFailure
  | {
      code: AdminRoleChangeErrorCode;
      message: string;
      status: 400 | 404;
    };

export function getAdminRoleChangeFailure(error: unknown): AdminRoleChangeFailure | null {
  const authorizationFailure = getAuthorizationFailure(error);

  if (authorizationFailure) {
    return authorizationFailure;
  }

  if (!(error instanceof AdminRoleChangeError)) {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    status: error.status,
  };
}

export async function changeAdminRoleForActor(
  actor: AuthorizationPrincipal | null,
  input: unknown,
  store: AdminRoleChangeStore,
): Promise<AdminRoleChangeResult> {
  const authorizedActor = assertRole(actor, AdminRole.SUPER_ADMIN);
  assertPermission(authorizedActor, Permission.MANAGE_ADMINISTRATORS);
  assertPermission(authorizedActor, Permission.MANAGE_PERMISSIONS);

  const parsed = changeAdminRoleInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new AdminRoleChangeError(
      AdminRoleChangeErrorCode.INVALID_REQUEST,
      "Invalid administrator role change request.",
      400,
    );
  }

  const target = await store.findAdminById(parsed.data.targetAdminId);

  if (!target) {
    throw new AdminRoleChangeError(
      AdminRoleChangeErrorCode.ADMIN_NOT_FOUND,
      "Administrator account not found.",
      404,
    );
  }

  const decision = evaluateRoleAssignment(authorizedActor, target, parsed.data.role);

  if (!decision.allowed) {
    throw new ForbiddenError();
  }

  if (
    target.role === AdminRole.SUPER_ADMIN &&
    parsed.data.role !== AdminRole.SUPER_ADMIN &&
    target.isActive !== false
  ) {
    if (!store.countActiveSuperAdmins) {
      throw new ForbiddenError();
    }

    const activeSuperAdminCount = await store.countActiveSuperAdmins();

    if (activeSuperAdminCount <= 1) {
      throw new ForbiddenError();
    }
  }

  if (target.role === parsed.data.role) {
    return {
      ...target,
      changed: false,
    };
  }

  const updatedAdmin = await store.updateAdminRole({
    actor: authorizedActor,
    target,
    role: parsed.data.role,
  });

  return {
    ...updatedAdmin,
    changed: true,
  };
}
