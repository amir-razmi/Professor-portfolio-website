import type { AdminRole } from "@prisma/client";

import { assertAnyRole, assertPermission, assertRole } from "./access-control";
import { Permission, getPermissionsForRole } from "./permissions";
import { requireAuth, type CurrentAdmin, type RequireAuthOptions } from "./session";

export { assertAnyRole, assertAuthenticated, assertPermission, assertRole } from "./access-control";
export {
  Permission,
  ROLE_PERMISSIONS,
  canAssignRole,
  evaluateRoleAssignment,
  getPermissionsForRole,
  hasAnyRole,
  hasPermission,
  hasRole,
  RoleAssignmentDenialReason,
} from "./permissions";
export {
  AuthorizationError,
  AuthorizationErrorCode,
  ForbiddenError,
  UnauthorizedError,
  getAuthorizationFailure,
} from "./authorization-error";
export { requireAuth } from "./session";
export type { AuthorizationFailure } from "./authorization-error";
export type {
  RoleAssignmentDecision,
  RoleAssignmentDenialReason as RoleAssignmentDenialReasonName,
} from "./permissions";
export type { CurrentAdmin, RequireAuthOptions } from "./session";

export async function requireRole(
  role: AdminRole,
  options?: RequireAuthOptions,
): Promise<CurrentAdmin> {
  return assertRole(await requireAuth(options), role);
}

export async function requireAnyRole(
  roles: readonly AdminRole[],
  options?: RequireAuthOptions,
): Promise<CurrentAdmin> {
  return assertAnyRole(await requireAuth(options), roles);
}

export async function requirePermission(
  permission: Permission,
  options?: RequireAuthOptions,
): Promise<CurrentAdmin> {
  return assertPermission(await requireAuth(options), permission);
}

export async function runWithPermission<Result>(
  permission: Permission,
  operation: (admin: CurrentAdmin) => Promise<Result> | Result,
  options?: RequireAuthOptions,
): Promise<Result> {
  const admin = await requirePermission(permission, options);
  return operation(admin);
}

export function getAuthorizationSummary(user: CurrentAdmin): {
  admin: Pick<CurrentAdmin, "id" | "email" | "displayName" | "role">;
  permissions: readonly Permission[];
} {
  return {
    admin: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    permissions: getPermissionsForRole(user.role),
  };
}
