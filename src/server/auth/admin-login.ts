import { verifyAdminCredentials, type AuthenticatedAdmin } from "./credentials";

export async function authenticateAdmin(input: unknown): Promise<AuthenticatedAdmin | null> {
  const { prisma } = await import("@/lib/prisma");

  return verifyAdminCredentials(input, {
    findAdmin: (email) =>
      prisma.adminUser.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          displayName: true,
          passwordHash: true,
          status: true,
          isActive: true,
        },
      }),
    updateLastLogin: async (adminId) => {
      await prisma.adminUser.update({
        where: { id: adminId },
        data: { lastLoginAt: new Date() },
      });
    },
  });
}
