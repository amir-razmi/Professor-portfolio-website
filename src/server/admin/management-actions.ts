"use server";

import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth/authorization";
import type { AdminManagementActionState } from "@/features/admin-management/admin-action-state";

import {
  createAdministrator,
  resetAdministratorPassword,
  setAdministratorStatus,
  updateAdministratorDetails,
} from "./admin-management-service";
import {
  executeCreateAdministratorAction,
  executeResetAdministratorPasswordAction,
  executeSetAdministratorStatusAction,
  executeUpdateAdministratorDetailsAction,
} from "./admin-management-action-handler";

export type { AdminManagementActionState } from "@/features/admin-management/admin-action-state";

function authorizeSuperAdmin() {
  return requireRole(AdminRole.SUPER_ADMIN, { onUnauthenticated: "throw" });
}

function revalidateAdminPages(adminId: string | null): void {
  revalidatePath("/admin/admins");
  revalidatePath("/admin/dashboard");

  if (adminId) {
    revalidatePath(`/admin/admins/${adminId}/edit`);
  }
}

export async function createAdministratorAction(
  previousState: AdminManagementActionState,
  formData: FormData,
): Promise<AdminManagementActionState> {
  const state = await executeCreateAdministratorAction(previousState, formData, {
    authorizeActor: authorizeSuperAdmin,
    create: createAdministrator,
    updateDetails: updateAdministratorDetails,
    setStatus: setAdministratorStatus,
    resetPassword: resetAdministratorPassword,
  });

  if (state.status === "success") {
    revalidateAdminPages(state.adminId);
  }

  return state;
}

export async function updateAdministratorDetailsAction(
  previousState: AdminManagementActionState,
  formData: FormData,
): Promise<AdminManagementActionState> {
  const state = await executeUpdateAdministratorDetailsAction(previousState, formData, {
    authorizeActor: authorizeSuperAdmin,
    create: createAdministrator,
    updateDetails: updateAdministratorDetails,
    setStatus: setAdministratorStatus,
    resetPassword: resetAdministratorPassword,
  });

  if (state.status === "success") {
    revalidateAdminPages(state.adminId);
  }

  return state;
}

export async function setAdministratorStatusAction(
  previousState: AdminManagementActionState,
  formData: FormData,
): Promise<AdminManagementActionState> {
  const state = await executeSetAdministratorStatusAction(previousState, formData, {
    authorizeActor: authorizeSuperAdmin,
    create: createAdministrator,
    updateDetails: updateAdministratorDetails,
    setStatus: setAdministratorStatus,
    resetPassword: resetAdministratorPassword,
  });

  if (state.status === "success") {
    revalidateAdminPages(state.adminId);
  }

  return state;
}

export async function resetAdministratorPasswordAction(
  previousState: AdminManagementActionState,
  formData: FormData,
): Promise<AdminManagementActionState> {
  const state = await executeResetAdministratorPasswordAction(previousState, formData, {
    authorizeActor: authorizeSuperAdmin,
    create: createAdministrator,
    updateDetails: updateAdministratorDetails,
    setStatus: setAdministratorStatus,
    resetPassword: resetAdministratorPassword,
  });

  if (state.status === "success") {
    revalidateAdminPages(state.adminId);
  }

  return state;
}
