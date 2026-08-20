import { AdminRole } from "@prisma/client";

export const Permission = {
  MANAGE_PROFESSOR_PROFILE: "professor-profile:manage",
  MANAGE_SITE_SETTINGS: "site-settings:manage",
  MANAGE_RESEARCH: "research:manage",
  MANAGE_PUBLICATIONS: "publications:manage",
  MANAGE_BLOG_POSTS: "blog-posts:manage",
  PUBLISH_BLOG_POSTS: "blog-posts:publish",
  MANAGE_FILES: "files:manage",
  MANAGE_ADMINISTRATORS: "administrators:manage",
  MANAGE_PERMISSIONS: "permissions:manage",
  MANAGE_AUTHENTICATION_SETTINGS: "authentication-settings:manage",
  VIEW_AUDIT_LOGS: "audit-logs:view",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export type AuthorizationPrincipal = {
  id: string;
  role: AdminRole;
};

const allPermissions = Object.freeze(Object.values(Permission));

export const ROLE_PERMISSIONS = Object.freeze({
  [AdminRole.SUPER_ADMIN]: allPermissions,
  [AdminRole.ADMIN]: Object.freeze([
    Permission.MANAGE_PROFESSOR_PROFILE,
    Permission.MANAGE_SITE_SETTINGS,
    Permission.MANAGE_RESEARCH,
    Permission.MANAGE_PUBLICATIONS,
    Permission.MANAGE_BLOG_POSTS,
    Permission.PUBLISH_BLOG_POSTS,
    Permission.MANAGE_FILES,
  ]),
  [AdminRole.EDITOR]: Object.freeze([Permission.MANAGE_BLOG_POSTS]),
}) satisfies Readonly<Record<AdminRole, readonly Permission[]>>;

const roleRank = Object.freeze({
  [AdminRole.EDITOR]: 1,
  [AdminRole.ADMIN]: 2,
  [AdminRole.SUPER_ADMIN]: 3,
}) satisfies Readonly<Record<AdminRole, number>>;

const emptyPermissions = Object.freeze([]) as readonly Permission[];

export function getPermissionsForRole(role: AdminRole): readonly Permission[] {
  return (
    (ROLE_PERMISSIONS as Partial<Record<AdminRole, readonly Permission[]>>)[role] ??
    emptyPermissions
  );
}

export function hasRole(user: AuthorizationPrincipal | null | undefined, role: AdminRole): boolean {
  return user?.role === role;
}

export function hasAnyRole(
  user: AuthorizationPrincipal | null | undefined,
  roles: readonly AdminRole[],
): boolean {
  return user ? roles.includes(user.role) : false;
}

export function hasPermission(
  user: AuthorizationPrincipal | null | undefined,
  permission: Permission,
): boolean {
  return user ? getPermissionsForRole(user.role).includes(permission) : false;
}

export const RoleAssignmentDenialReason = {
  SELF_ESCALATION: "SELF_ESCALATION",
  MISSING_PERMISSION: "MISSING_PERMISSION",
  TARGET_OUTRANKS_ACTOR: "TARGET_OUTRANKS_ACTOR",
  ROLE_ESCALATION: "ROLE_ESCALATION",
} as const;

export type RoleAssignmentDenialReason =
  (typeof RoleAssignmentDenialReason)[keyof typeof RoleAssignmentDenialReason];

export type RoleAssignmentDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: RoleAssignmentDenialReason;
    };

export function evaluateRoleAssignment(
  actor: AuthorizationPrincipal,
  target: AuthorizationPrincipal,
  requestedRole: AdminRole,
): RoleAssignmentDecision {
  const actorRank = roleRank[actor.role];
  const targetRank = roleRank[target.role];
  const requestedRank = roleRank[requestedRole];

  if (actor.id === target.id && requestedRank > actorRank) {
    return {
      allowed: false,
      reason: RoleAssignmentDenialReason.SELF_ESCALATION,
    };
  }

  if (targetRank > actorRank) {
    return {
      allowed: false,
      reason: RoleAssignmentDenialReason.TARGET_OUTRANKS_ACTOR,
    };
  }

  if (requestedRank > actorRank) {
    return {
      allowed: false,
      reason: RoleAssignmentDenialReason.ROLE_ESCALATION,
    };
  }

  if (
    !hasPermission(actor, Permission.MANAGE_ADMINISTRATORS) ||
    !hasPermission(actor, Permission.MANAGE_PERMISSIONS)
  ) {
    return {
      allowed: false,
      reason: RoleAssignmentDenialReason.MISSING_PERMISSION,
    };
  }

  return { allowed: true };
}

export function canAssignRole(
  actor: AuthorizationPrincipal,
  target: AuthorizationPrincipal,
  requestedRole: AdminRole,
): boolean {
  return evaluateRoleAssignment(actor, target, requestedRole).allowed;
}
