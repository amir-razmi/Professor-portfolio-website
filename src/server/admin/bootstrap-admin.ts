import { AdminAccountStatus, AdminRole } from "@prisma/client";
import { z } from "zod";

import { adminPasswordSchema, hashPassword } from "@/server/auth/password";

const mongoConnectionStringSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
    "DATABASE_URL must be a MongoDB connection string.",
  );

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const displayNameSchema = z.string().trim().min(1).max(120);

export const bootstrapAdminInputSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  password: adminPasswordSchema,
});

const bootstrapAdminEnvironmentSchema = z.object({
  DATABASE_URL: mongoConnectionStringSchema,
  DATABASE_ENV: z.enum(["development", "production"]),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BOOTSTRAP_ADMIN_EMAIL: emailSchema,
  BOOTSTRAP_ADMIN_NAME: displayNameSchema,
  BOOTSTRAP_ADMIN_PASSWORD: adminPasswordSchema,
  BOOTSTRAP_ADMIN_CONFIRMATION: z.literal("YES"),
});

export type BootstrapAdminInput = z.infer<typeof bootstrapAdminInputSchema>;
export type BootstrapAdminEnvironment = z.infer<typeof bootstrapAdminEnvironmentSchema>;

export type BootstrapAdminRecord = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminAccountStatus;
  isActive: boolean;
};

export type BootstrapAdminStore = {
  findAdministratorByEmail: (email: string) => Promise<BootstrapAdminRecord | null>;
  countActiveSuperAdmins: () => Promise<number>;
  createSuperAdmin: (input: {
    data: BootstrapAdminInput;
    passwordHash: string;
  }) => Promise<BootstrapAdminRecord>;
};

export const BootstrapAdminErrorCode = {
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_ENVIRONMENT: "INVALID_ENVIRONMENT",
  ACTIVE_SUPER_ADMIN_EXISTS: "ACTIVE_SUPER_ADMIN_EXISTS",
  EXISTING_ACCOUNT_CONFLICT: "EXISTING_ACCOUNT_CONFLICT",
} as const;

export type BootstrapAdminErrorCode =
  (typeof BootstrapAdminErrorCode)[keyof typeof BootstrapAdminErrorCode];

export class BootstrapAdminError extends Error {
  readonly code: BootstrapAdminErrorCode;

  constructor(code: BootstrapAdminErrorCode, message: string) {
    super(message);
    this.name = "BootstrapAdminError";
    this.code = code;
  }
}

export type BootstrapAdminResult =
  | {
      created: true;
      admin: BootstrapAdminRecord;
    }
  | {
      created: false;
      reason: "ALREADY_CONFIGURED";
      admin: BootstrapAdminRecord;
    };

function isLikelyDevelopmentDatabase(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, "")).split("/")[0];

    return /(?:^|[-_])(dev|development|test)(?:[-_]|$)/i.test(databaseName);
  } catch {
    return false;
  }
}

function invalidInput(): never {
  throw new BootstrapAdminError(
    BootstrapAdminErrorCode.INVALID_INPUT,
    "Review the bootstrap administrator email, name, and password.",
  );
}

export function parseBootstrapAdminInput(input: unknown): BootstrapAdminInput {
  const parsed = bootstrapAdminInputSchema.safeParse(input);

  if (!parsed.success) {
    invalidInput();
  }

  return parsed.data;
}

export function parseBootstrapAdminEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): BootstrapAdminEnvironment {
  const parsed = bootstrapAdminEnvironmentSchema.safeParse(environment);

  if (
    !parsed.success ||
    parsed.data.NODE_ENV === "test" ||
    (parsed.data.DATABASE_ENV === "development" &&
      !isLikelyDevelopmentDatabase(parsed.data.DATABASE_URL))
  ) {
    throw new BootstrapAdminError(
      BootstrapAdminErrorCode.INVALID_ENVIRONMENT,
      "Refusing to bootstrap. Set an explicit confirmation and use a valid development or production MongoDB environment.",
    );
  }

  return parsed.data;
}

function isActiveSuperAdmin(admin: BootstrapAdminRecord): boolean {
  return (
    admin.role === AdminRole.SUPER_ADMIN &&
    admin.status === AdminAccountStatus.ACTIVE &&
    admin.isActive
  );
}

/**
 * Creates the first administrator only when no active SUPER_ADMIN exists.
 *
 * Re-running with the same active SUPER_ADMIN email is an intentional no-op:
 * the password is never reset implicitly. Existing non-SUPER_ADMIN or inactive
 * accounts are treated as conflicts so a deployment typo cannot escalate or
 * reactivate an account silently.
 */
export async function bootstrapSuperAdmin(
  input: unknown,
  store: BootstrapAdminStore,
): Promise<BootstrapAdminResult> {
  const parsed = parseBootstrapAdminInput(input);
  const existing = await store.findAdministratorByEmail(parsed.email);

  if (existing) {
    if (isActiveSuperAdmin(existing)) {
      return {
        created: false,
        reason: "ALREADY_CONFIGURED",
        admin: existing,
      };
    }

    throw new BootstrapAdminError(
      BootstrapAdminErrorCode.EXISTING_ACCOUNT_CONFLICT,
      "The bootstrap email belongs to an existing administrator that is not an active SUPER_ADMIN. No changes were made.",
    );
  }

  if ((await store.countActiveSuperAdmins()) > 0) {
    throw new BootstrapAdminError(
      BootstrapAdminErrorCode.ACTIVE_SUPER_ADMIN_EXISTS,
      "An active SUPER_ADMIN already exists. No additional bootstrap account was created.",
    );
  }

  const passwordHash = await hashPassword(parsed.password);
  const admin = await store.createSuperAdmin({
    data: parsed,
    passwordHash,
  });

  return {
    created: true,
    admin,
  };
}
