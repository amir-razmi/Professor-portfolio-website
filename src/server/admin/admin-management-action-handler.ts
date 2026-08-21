import type { AuthorizationPrincipal } from "@/server/auth/permissions";

import {
  getAdminManagementFailure,
  type AdministratorMutationResult,
  type AdministratorRecord,
} from "./admin-management-policy";
import {
  initialAdminManagementActionState,
  type AdminManagementActionState,
} from "@/features/admin-management/admin-action-state";

export { initialAdminManagementActionState };
export type { AdminManagementActionState } from "@/features/admin-management/admin-action-state";

export type AdminManagementActionDependencies = {
  authorizeActor: () => Promise<AuthorizationPrincipal>;
  create: (actor: AuthorizationPrincipal, input: unknown) => Promise<AdministratorRecord>;
  updateDetails: (actor: AuthorizationPrincipal, input: unknown) => Promise<AdministratorRecord>;
  setStatus: (
    actor: AuthorizationPrincipal,
    input: unknown,
  ) => Promise<AdministratorMutationResult>;
  resetPassword: (actor: AuthorizationPrincipal, input: unknown) => Promise<AdministratorRecord>;
};

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function failureState(error: unknown): AdminManagementActionState {
  const failure = getAdminManagementFailure(error);

  if (!failure) {
    return {
      status: "error",
      message: "The administrator request could not be completed. Please try again.",
      fieldErrors: {},
      adminId: null,
    };
  }

  return {
    status: "error",
    message: failure.message,
    fieldErrors: "fieldErrors" in failure ? failure.fieldErrors : {},
    adminId: null,
  };
}

function successState(message: string, admin: AdministratorRecord): AdminManagementActionState {
  return {
    status: "success",
    message,
    fieldErrors: {},
    adminId: admin.id,
  };
}

export async function executeCreateAdministratorAction(
  previousState: AdminManagementActionState,
  formData: FormData,
  dependencies: AdminManagementActionDependencies,
): Promise<AdminManagementActionState> {
  void previousState;

  try {
    const actor = await dependencies.authorizeActor();
    const admin = await dependencies.create(actor, {
      email: getString(formData, "email"),
      displayName: getString(formData, "displayName"),
      role: getString(formData, "role"),
      status: getString(formData, "status"),
      password: getString(formData, "password"),
      passwordConfirmation: getString(formData, "passwordConfirmation"),
    });

    return successState("Administrator account created.", admin);
  } catch (error) {
    return failureState(error);
  }
}

export async function executeUpdateAdministratorDetailsAction(
  previousState: AdminManagementActionState,
  formData: FormData,
  dependencies: AdminManagementActionDependencies,
): Promise<AdminManagementActionState> {
  void previousState;

  try {
    const actor = await dependencies.authorizeActor();
    const admin = await dependencies.updateDetails(actor, {
      targetAdminId: getString(formData, "targetAdminId"),
      email: getString(formData, "email"),
      displayName: getString(formData, "displayName"),
    });

    return successState("Administrator details saved.", admin);
  } catch (error) {
    return failureState(error);
  }
}

export async function executeSetAdministratorStatusAction(
  previousState: AdminManagementActionState,
  formData: FormData,
  dependencies: AdminManagementActionDependencies,
): Promise<AdminManagementActionState> {
  void previousState;

  try {
    const actor = await dependencies.authorizeActor();
    const admin = await dependencies.setStatus(actor, {
      targetAdminId: getString(formData, "targetAdminId"),
      status: getString(formData, "status"),
    });

    return successState(
      admin.changed
        ? admin.isActive
          ? "Administrator account reactivated."
          : "Administrator account deactivated."
        : "Administrator account already has that status.",
      admin,
    );
  } catch (error) {
    return failureState(error);
  }
}

export async function executeResetAdministratorPasswordAction(
  previousState: AdminManagementActionState,
  formData: FormData,
  dependencies: AdminManagementActionDependencies,
): Promise<AdminManagementActionState> {
  void previousState;

  try {
    const actor = await dependencies.authorizeActor();
    const admin = await dependencies.resetPassword(actor, {
      targetAdminId: getString(formData, "targetAdminId"),
      password: getString(formData, "password"),
      passwordConfirmation: getString(formData, "passwordConfirmation"),
    });

    return successState("Administrator password reset.", admin);
  } catch (error) {
    return failureState(error);
  }
}
