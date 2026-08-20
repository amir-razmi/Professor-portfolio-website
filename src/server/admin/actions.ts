"use server";

import { Permission, requirePermission } from "@/server/auth/authorization";

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
  return executeChangeAdminRoleAction(previousState, formData, {
    authorizeActor: () =>
      requirePermission(Permission.MANAGE_ADMINISTRATORS, {
        onUnauthenticated: "throw",
      }),
    changeRole: changeAdminRoleAs,
  });
}
