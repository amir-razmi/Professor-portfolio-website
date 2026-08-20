import type { AuthorizationPrincipal } from "@/server/auth/permissions";

import { getAdminRoleChangeFailure, type AdminRoleChangeResult } from "./admin-role-policy";

export type ChangeAdminRoleActionState =
  | {
      ok: true;
      admin: AdminRoleChangeResult;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export type ChangeAdminRoleActionDependencies = {
  authorizeActor: () => Promise<AuthorizationPrincipal>;
  changeRole: (
    actor: AuthorizationPrincipal,
    input: {
      targetAdminId: unknown;
      role: unknown;
    },
  ) => Promise<AdminRoleChangeResult>;
};

export async function executeChangeAdminRoleAction(
  previousState: ChangeAdminRoleActionState,
  formData: FormData,
  dependencies: ChangeAdminRoleActionDependencies,
): Promise<ChangeAdminRoleActionState> {
  void previousState;

  try {
    const actor = await dependencies.authorizeActor();
    const admin = await dependencies.changeRole(actor, {
      targetAdminId: formData.get("targetAdminId"),
      role: formData.get("role"),
    });

    return {
      ok: true,
      admin,
    };
  } catch (error) {
    const failure = getAdminRoleChangeFailure(error);

    if (failure) {
      return {
        ok: false,
        code: failure.code,
        message: failure.message,
      };
    }

    throw error;
  }
}
