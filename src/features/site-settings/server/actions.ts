"use server";

import { revalidatePath } from "next/cache";

import { Permission, requirePermission } from "@/server/auth/authorization";
import { getContentMutationFailure, type FieldErrors } from "@/server/content/content-errors";

import { siteSettingsFormDataToInput } from "../settings-schema";
import { updateSiteSettingsAs } from "./settings-service";

export type SiteSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: FieldErrors;
};

export async function updateSiteSettingsAction(
  previousState: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_SITE_SETTINGS, {
      onUnauthenticated: "throw",
    });

    await updateSiteSettingsAs(admin, siteSettingsFormDataToInput(formData));

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/settings");

    return {
      status: "success",
      message: "Site settings saved.",
      fieldErrors: {},
    };
  } catch (error) {
    const failure = getContentMutationFailure(error);

    if (failure) {
      return {
        status: "error",
        message: failure.message,
        fieldErrors: "fieldErrors" in failure ? failure.fieldErrors : {},
      };
    }

    console.error("Site settings update failed unexpectedly.");

    return {
      status: "error",
      message: "Unable to save site settings. Please try again.",
      fieldErrors: {},
    };
  }
}
