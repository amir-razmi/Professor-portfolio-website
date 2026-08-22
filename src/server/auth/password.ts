import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

export const adminPasswordSchema = z
  .string()
  .min(12, "گذرواژه مدیر باید حداقل ۱۲ کاراکتر داشته باشد.")
  .max(128, "گذرواژه مدیر باید حداکثر ۱۲۸ کاراکتر داشته باشد.");

export async function hashPassword(password: string): Promise<string> {
  const result = adminPasswordSchema.safeParse(password);

  if (!result.success) {
    throw new Error("گذرواژه مدیر شرایط لازم را ندارد.");
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
