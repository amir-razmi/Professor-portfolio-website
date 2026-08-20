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
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    MONGODB_URL: process.env.MONGODB_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");
    throw new Error(`Invalid server environment: ${fields}`);
  }

  return result.data;
}
