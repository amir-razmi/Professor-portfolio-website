import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URL: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URL must be a MongoDB connection string",
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const authSecretSchema = z.string().trim().min(32);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    MONGODB_URL: process.env.MONGODB_URL,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_ENV: process.env.DATABASE_ENV,
  });

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");
    throw new Error(`Invalid server environment: ${fields}`);
  }

  return result.data;
}

export function getAuthSecret(): string {
  const result = authSecretSchema.safeParse(process.env.AUTH_SECRET);

  if (!result.success) {
    throw new Error(
      "Invalid authentication environment: AUTH_SECRET must be at least 32 characters.",
    );
  }

  return result.data;
}
