import "server-only";

import { AdminAccountStatus, AdminRole } from "@prisma/client";

import { ForbiddenError } from "../auth/authorization-error";
import { recordAuditLogInTransaction } from "../audit/audit-service";
import {
  AdminRoleChangeError,
  AdminRoleChangeErrorCode,
  changeAdminRoleForActor,
  type AdminRoleChangeResult,
  type AdminRoleChangeStore,
} from "./admin-role-policy";
import type { AuthorizationPrincipal } from "../auth/permissions";

const prismaAdminRoleStore: AdminRoleChangeStore = {
  async findAdminById(adminId) {
    const { prisma } = await import("@/lib/prisma");

    return prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        role: true,
        isActive: true,
        status: true,
      },
    });
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
  async updateAdminRole({ actor, target, role }) {
    const { prisma } = await import("@/lib/prisma");

    return prisma.$transaction(async (transaction) => {
      const currentTarget = await transaction.adminUser.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          role: true,
          isActive: true,
          status: true,
        },
      });

      if (!currentTarget) {
        throw new AdminRoleChangeError(
          AdminRoleChangeErrorCode.ADMIN_NOT_FOUND,
          "Administrator account not found.",
          404,
        );
      }

      if (currentTarget.id === actor.id && role !== currentTarget.role) {
        throw new ForbiddenError();
      }

      if (
        currentTarget.role === AdminRole.SUPER_ADMIN &&
        role !== AdminRole.SUPER_ADMIN &&
        currentTarget.isActive &&
        currentTarget.status === AdminAccountStatus.ACTIVE
      ) {
        const activeSuperAdminCount = await transaction.adminUser.count({
          where: {
            role: AdminRole.SUPER_ADMIN,
            status: AdminAccountStatus.ACTIVE,
            isActive: true,
          },
        });

        if (activeSuperAdminCount <= 1) {
          throw new ForbiddenError();
        }
      }

      const updatedAdmin = await transaction.adminUser.update({
        where: { id: target.id },
        data: {
          role,
          updatedById: actor.id,
        },
        select: {
          id: true,
          role: true,
        },
      });

      await recordAuditLogInTransaction(transaction, {
        action: "UPDATE",
        targetResource: "AdminUser",
        targetId: target.id,
        summary: `Administrator role changed from ${currentTarget.role} to ${role}.`,
        actorId: actor.id,
        metadata: { previousRole: currentTarget.role, role },
      });

      return updatedAdmin;
    });
  },
};

export async function changeAdminRoleAs(
  actor: AuthorizationPrincipal,
  input: unknown,
): Promise<AdminRoleChangeResult> {
  return changeAdminRoleForActor(actor, input, prismaAdminRoleStore);
}
