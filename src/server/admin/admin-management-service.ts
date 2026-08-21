import "server-only";

import { AdminAccountStatus, AdminRole, Prisma } from "@prisma/client";

import type { AuthorizationPrincipal } from "@/server/auth/permissions";
import { recordAuditLogInTransaction } from "@/server/audit/audit-service";

import {
  AdminManagementError,
  AdminManagementErrorCode,
  countActiveSuperAdminsForActor,
  createAdministratorForActor,
  getAdministratorForActor,
  listAdministratorsForActor,
  resetAdministratorPasswordForActor,
  setAdministratorStatusForActor,
  updateAdministratorDetailsForActor,
  type AdministratorManagementStore,
  type AdministratorMutationResult,
  type AdministratorRecord,
} from "./admin-management-policy";

const administratorSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedAdministrator = Prisma.AdminUserGetPayload<{
  select: typeof administratorSelect;
}>;

function mapAdministrator(admin: SelectedAdministrator): AdministratorRecord {
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    status: admin.status,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function emailTaken(): never {
  throw new AdminManagementError(
    AdminManagementErrorCode.EMAIL_TAKEN,
    "An administrator with that email already exists.",
    409,
    { email: ["An administrator with that email already exists."] },
  );
}

const prismaAdministratorStore: AdministratorManagementStore = {
  async listAdministrators() {
    const { prisma } = await import("@/lib/prisma");
    const admins = await prisma.adminUser.findMany({
      select: administratorSelect,
      orderBy: { createdAt: "desc" },
    });

    return admins.map(mapAdministrator);
  },

  async findAdministratorById(id) {
    const { prisma } = await import("@/lib/prisma");
    const admin = await prisma.adminUser.findUnique({
      where: { id },
      select: administratorSelect,
    });

    return admin ? mapAdministrator(admin) : null;
  },

  async countActiveSuperAdmins() {
    const { prisma } = await import("@/lib/prisma");

    return prisma.adminUser.count({
      where: {
        role: AdminRole.SUPER_ADMIN,
        status: AdminAccountStatus.ACTIVE,
        isActive: true,
      },
    });
  },

  async createAdministrator({ actor, data, passwordHash }) {
    const { prisma } = await import("@/lib/prisma");
    const isActive = data.status === AdminAccountStatus.ACTIVE;

    try {
      const created = await prisma.$transaction(async (transaction) => {
        const admin = await transaction.adminUser.create({
          data: {
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            status: data.status,
            isActive,
            passwordHash,
            createdById: actor.id,
            updatedById: actor.id,
          },
          select: administratorSelect,
        });

        await recordAuditLogInTransaction(transaction, {
          action: "CREATE",
          targetResource: "AdminUser",
          targetId: admin.id,
          summary: `Administrator account created with role ${data.role}.`,
          actorId: actor.id,
          metadata: { role: data.role, status: data.status },
        });

        return admin;
      });

      return mapAdministrator(created);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        emailTaken();
      }

      throw error;
    }
  },

  async updateAdministratorDetails({ actor, target, data }) {
    const { prisma } = await import("@/lib/prisma");

    try {
      const updated = await prisma.$transaction(async (transaction) => {
        const admin = await transaction.adminUser.update({
          where: { id: target.id },
          data: {
            email: data.email,
            displayName: data.displayName,
            updatedById: actor.id,
          },
          select: administratorSelect,
        });

        await recordAuditLogInTransaction(transaction, {
          action: "UPDATE",
          targetResource: "AdminUser",
          targetId: target.id,
          summary: "Administrator profile details updated.",
          actorId: actor.id,
        });

        return admin;
      });

      return mapAdministrator(updated);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        emailTaken();
      }

      throw error;
    }
  },

  async setAdministratorStatus({ actor, target, status, isActive }) {
    const { prisma } = await import("@/lib/prisma");

    const updated = await prisma.$transaction(async (transaction) => {
      const currentTarget = await transaction.adminUser.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          role: true,
          status: true,
          isActive: true,
        },
      });

      if (!currentTarget) {
        throw new AdminManagementError(
          AdminManagementErrorCode.ADMIN_NOT_FOUND,
          "Administrator account not found.",
          404,
        );
      }

      if (currentTarget.id === actor.id && (status !== AdminAccountStatus.ACTIVE || !isActive)) {
        throw new AdminManagementError(
          AdminManagementErrorCode.SELF_DEACTIVATION,
          "You cannot deactivate your own administrator account.",
          403,
        );
      }

      if (
        currentTarget.role === AdminRole.SUPER_ADMIN &&
        currentTarget.status === AdminAccountStatus.ACTIVE &&
        currentTarget.isActive &&
        (!isActive || status !== AdminAccountStatus.ACTIVE)
      ) {
        const activeSuperAdminCount = await transaction.adminUser.count({
          where: {
            role: AdminRole.SUPER_ADMIN,
            status: AdminAccountStatus.ACTIVE,
            isActive: true,
          },
        });

        if (activeSuperAdminCount <= 1) {
          throw new AdminManagementError(
            AdminManagementErrorCode.LAST_SUPER_ADMIN,
            "The last active SUPER_ADMIN cannot be deactivated.",
            403,
          );
        }
      }

      const admin = await transaction.adminUser.update({
        where: { id: target.id },
        data: {
          status,
          isActive,
          updatedById: actor.id,
        },
        select: administratorSelect,
      });

      await recordAuditLogInTransaction(transaction, {
        action: isActive ? "ENABLE" : "DISABLE",
        targetResource: "AdminUser",
        targetId: target.id,
        summary: isActive
          ? "Administrator account reactivated."
          : "Administrator account deactivated.",
        actorId: actor.id,
        metadata: { status, isActive },
      });

      return admin;
    });

    return mapAdministrator(updated);
  },

  async resetAdministratorPassword({ actor, target, passwordHash }) {
    const { prisma } = await import("@/lib/prisma");

    const updated = await prisma.$transaction(async (transaction) => {
      const admin = await transaction.adminUser.update({
        where: { id: target.id },
        data: {
          passwordHash,
          updatedById: actor.id,
        },
        select: administratorSelect,
      });

      await recordAuditLogInTransaction(transaction, {
        action: "UPDATE",
        targetResource: "AdminUser",
        targetId: target.id,
        summary: "Administrator password reset.",
        actorId: actor.id,
        metadata: { passwordReset: true },
      });

      return admin;
    });

    return mapAdministrator(updated);
  },
};

export function listAdministrators(actor: AuthorizationPrincipal | null) {
  return listAdministratorsForActor(actor, prismaAdministratorStore);
}

export function getAdministrator(actor: AuthorizationPrincipal | null, id: unknown) {
  return getAdministratorForActor(actor, id, prismaAdministratorStore);
}

export function countActiveSuperAdmins(actor: AuthorizationPrincipal | null) {
  return countActiveSuperAdminsForActor(actor, prismaAdministratorStore);
}

export function createAdministrator(actor: AuthorizationPrincipal | null, input: unknown) {
  return createAdministratorForActor(actor, input, prismaAdministratorStore);
}

export function updateAdministratorDetails(actor: AuthorizationPrincipal | null, input: unknown) {
  return updateAdministratorDetailsForActor(actor, input, prismaAdministratorStore);
}

export function setAdministratorStatus(actor: AuthorizationPrincipal | null, input: unknown) {
  return setAdministratorStatusForActor(actor, input, prismaAdministratorStore);
}

export function resetAdministratorPassword(actor: AuthorizationPrincipal | null, input: unknown) {
  return resetAdministratorPasswordForActor(actor, input, prismaAdministratorStore);
}

export type { AdministratorMutationResult, AdministratorRecord };
