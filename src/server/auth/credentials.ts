import { AdminAccountStatus } from "@prisma/client";
import { z } from "zod";

import { hashPassword, verifyPassword } from "./password";

export const adminCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});

export const invalidCredentialsMessage = "Invalid email or password.";

export type AdminCredentialRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  status: AdminAccountStatus;
  isActive: boolean;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
};

type CredentialDependencies = {
  findAdmin: (email: string) => Promise<AdminCredentialRecord | null>;
  updateLastLogin?: (adminId: string) => Promise<void>;
};

// This is a non-secret hash used only to make the missing-account path perform
// the same expensive password comparison as an existing-account path.
const dummyPasswordHashPromise = hashPassword("credential-miss-sentinel");

export async function verifyAdminCredentials(
  input: unknown,
  dependencies: CredentialDependencies,
): Promise<AuthenticatedAdmin | null> {
  const parsed = adminCredentialsSchema.safeParse(input);
  const rawPassword =
    typeof input === "object" && input !== null && "password" in input
      ? (input as Record<string, unknown>).password
      : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const email = parsed.success ? parsed.data.email : "";
  const admin = parsed.success ? await dependencies.findAdmin(email) : null;
  const passwordHash = admin?.passwordHash ?? (await dummyPasswordHashPromise);
  const passwordMatches = await verifyPassword(password, passwordHash);

  if (
    !parsed.success ||
    !admin ||
    !passwordMatches ||
    admin.status !== AdminAccountStatus.ACTIVE ||
    !admin.isActive
  ) {
    return null;
  }

  await dependencies.updateLastLogin?.(admin.id);

  return {
    id: admin.id,
    email: admin.email,
    name: admin.displayName,
  };
}
