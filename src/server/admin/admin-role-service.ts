import "server-only";

import { AuditAction } from "@prisma/client";

import {
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
      },
    });
  },
  async updateAdminRole({ actor, target, role }) {
    const { prisma } = await import("@/lib/prisma");

    return prisma.$transaction(async (transaction) => {
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

      await transaction.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          targetResource: "AdminUser",
          targetId: target.id,
          summary: `Administrator role changed from ${target.role} to ${role}.`,
          actorId: actor.id,
        },
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
