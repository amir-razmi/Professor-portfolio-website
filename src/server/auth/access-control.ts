import type { AdminRole } from "@prisma/client";

import { ForbiddenError, UnauthorizedError } from "./authorization-error";
import {
  hasAnyRole,
  hasPermission,
  hasRole,
  type AuthorizationPrincipal,
  type Permission,
} from "./permissions";

export function assertAuthenticated<T extends AuthorizationPrincipal>(
  user: T | null | undefined,
): T {
  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export function assertRole<T extends AuthorizationPrincipal>(
  user: T | null | undefined,
  role: AdminRole,
): T {
  const authenticatedUser = assertAuthenticated(user);

  if (!hasRole(authenticatedUser, role)) {
    throw new ForbiddenError();
  }

  return authenticatedUser;
}

export function assertAnyRole<T extends AuthorizationPrincipal>(
  user: T | null | undefined,
  roles: readonly AdminRole[],
): T {
  const authenticatedUser = assertAuthenticated(user);

  if (!hasAnyRole(authenticatedUser, roles)) {
    throw new ForbiddenError();
  }

  return authenticatedUser;
}

export function assertPermission<T extends AuthorizationPrincipal>(
  user: T | null | undefined,
  permission: Permission,
): T {
  const authenticatedUser = assertAuthenticated(user);

  if (!hasPermission(authenticatedUser, permission)) {
    throw new ForbiddenError();
  }

  return authenticatedUser;
}
