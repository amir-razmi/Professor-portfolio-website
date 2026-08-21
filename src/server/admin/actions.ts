"use server";

import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/authorization";

import { changeAdminRoleAs } from "./admin-role-service";
import {
  executeChangeAdminRoleAction,
  type ChangeAdminRoleActionState,
} from "./change-admin-role-action-handler";

export type { ChangeAdminRoleActionState } from "./change-admin-role-action-handler";

export async function changeAdminRoleAction(
  previousState: ChangeAdminRoleActionState,
  formData: FormData,
): Promise<ChangeAdminRoleActionState> {
  const state = await executeChangeAdminRoleAction(previousState, formData, {
    authorizeActor: () =>
      requireRole(AdminRole.SUPER_ADMIN, {
        onUnauthenticated: "throw",
      }),
    changeRole: changeAdminRoleAs,
  });

  if (state.ok) {
    revalidatePath("/admin/admins");
    revalidatePath(`/admin/admins/${state.admin.id}/edit`);
    revalidatePath("/admin/dashboard");
  }

  return state;
}
