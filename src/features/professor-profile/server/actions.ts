"use server";

import { revalidatePath } from "next/cache";

import { Permission, requirePermission } from "@/server/auth/authorization";
import { getContentMutationFailure, type FieldErrors } from "@/server/content/content-errors";

import { professorProfileFormDataToInput } from "../profile-schema";
import { updateProfessorProfileAs } from "./profile-service";

export type ProfessorProfileActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: FieldErrors;
};

export async function updateProfessorProfileAction(
  previousState: ProfessorProfileActionState,
  formData: FormData,
): Promise<ProfessorProfileActionState> {
  void previousState;

  try {
    const admin = await requirePermission(Permission.MANAGE_PROFESSOR_PROFILE, {
      onUnauthenticated: "throw",
    });

    await updateProfessorProfileAs(admin, professorProfileFormDataToInput(formData));

    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/profile");

    return {
      status: "success",
      message: "پروفایل استاد ذخیره شد.",
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

    console.error("Professor profile update failed unexpectedly.");

    return {
      status: "error",
      message: "ذخیره پروفایل استاد ممکن نشد. دوباره تلاش کنید.",
      fieldErrors: {},
    };
  }
}
