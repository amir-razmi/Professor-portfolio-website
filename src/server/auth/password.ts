import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

export const adminPasswordSchema = z
  .string()
  .min(12, "Administrator passwords must be at least 12 characters.")
  .max(128, "Administrator passwords must be 128 characters or fewer.");

export async function hashPassword(password: string): Promise<string> {
  const result = adminPasswordSchema.safeParse(password);

  if (!result.success) {
    throw new Error("Administrator password does not meet the minimum requirements.");
  }

  return bcrypt.hash(result.data, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}
