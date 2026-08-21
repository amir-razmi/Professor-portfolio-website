import "server-only";

import { forbidden } from "next/navigation";
import type { AdminRole } from "@prisma/client";

import { ForbiddenError } from "./authorization-error";
import { requirePermission, requireRole } from "./authorization";
import type { Permission } from "./permissions";
import type { CurrentAdmin } from "./session";

export async function requirePagePermission(permission: Permission): Promise<CurrentAdmin> {
  try {
    return await requirePermission(permission);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      forbidden();
    }

    throw error;
  }
}

export async function requirePageRole(role: AdminRole): Promise<CurrentAdmin> {
  try {
    return await requireRole(role);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      forbidden();
    }

    throw error;
  }
}
