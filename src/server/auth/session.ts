import { AdminAccountStatus, type AdminRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export type CurrentAdmin = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await auth();
  const adminId = session?.user?.id;

  if (!adminId || !objectIdSchema.safeParse(adminId).success) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
      isActive: true,
    },
  });

  if (!admin || admin.status !== AdminAccountStatus.ACTIVE || !admin.isActive) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
  };
}

export async function requireAuth(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return admin;
}
