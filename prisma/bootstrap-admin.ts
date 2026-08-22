import "dotenv/config";

import { AdminAccountStatus, AdminRole, AuditAction, Prisma, PrismaClient } from "@prisma/client";

import { writeAuditLog } from "../src/server/audit/audit-policy";
import {
  bootstrapSuperAdmin,
  parseBootstrapAdminEnvironment,
  type BootstrapAdminRecord,
  type BootstrapAdminStore,
} from "../src/server/admin/bootstrap-admin";

const prisma = new PrismaClient();

const administratorSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  isActive: true,
} as const;

type SelectedAdministrator = Prisma.AdminUserGetPayload<{
  select: typeof administratorSelect;
}>;

function mapAdministrator(admin: SelectedAdministrator): BootstrapAdminRecord {
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    status: admin.status,
    isActive: admin.isActive,
  };
}

function createStore(transaction: Prisma.TransactionClient): BootstrapAdminStore {
  return {
    async findAdministratorByEmail(email) {
      const admin = await transaction.adminUser.findUnique({
        where: { email },
        select: administratorSelect,
      });

      return admin ? mapAdministrator(admin) : null;
    },

    countActiveSuperAdmins() {
      return transaction.adminUser.count({
        where: {
          role: AdminRole.SUPER_ADMIN,
          status: AdminAccountStatus.ACTIVE,
          isActive: true,
        },
      });
    },

    async createSuperAdmin({ data, passwordHash }) {
      const admin = await transaction.adminUser.create({
        data: {
          email: data.email,
          displayName: data.displayName,
          passwordHash,
          role: AdminRole.SUPER_ADMIN,
          status: AdminAccountStatus.ACTIVE,
          isActive: true,
        },
        select: administratorSelect,
      });

      await writeAuditLog(transaction, {
        actorId: null,
        action: AuditAction.CREATE,
        targetResource: "AdminUser",
        targetId: admin.id,
        summary: "Initial SUPER_ADMIN account bootstrapped.",
        metadata: {
          bootstrap: true,
          role: AdminRole.SUPER_ADMIN,
          status: AdminAccountStatus.ACTIVE,
        },
      });

      return mapAdministrator(admin);
    },
  };
}

async function main() {
  const environment = parseBootstrapAdminEnvironment();

  const result = await prisma.$transaction((transaction) =>
    bootstrapSuperAdmin(
      {
        email: environment.BOOTSTRAP_ADMIN_EMAIL,
        displayName: environment.BOOTSTRAP_ADMIN_NAME,
        password: environment.BOOTSTRAP_ADMIN_PASSWORD,
      },
      createStore(transaction),
    ),
  );

  if (result.created) {
    console.log(`Initial SUPER_ADMIN created for ${result.admin.email}.`);
  } else {
    console.log(`SUPER_ADMIN ${result.admin.email} is already configured; no changes were made.`);
  }
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error && error.name === "BootstrapAdminError") {
      console.error(error.message);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      console.error(
        "Bootstrap could not create the administrator because the email is already in use. No password was changed.",
      );
    } else {
      console.error(
        "Administrator bootstrap failed. Check the database and environment configuration.",
      );
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
