"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

import { adminCredentialsSchema, invalidCredentialsMessage } from "./credentials";
import { performLogout } from "./logout";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void previousState;

  const parsed = adminCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: invalidCredentialsMessage };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: invalidCredentialsMessage };
    }

    throw error;
  }

  return { error: invalidCredentialsMessage };
}

export async function logoutAction(): Promise<void> {
  await performLogout(signOut);
}
