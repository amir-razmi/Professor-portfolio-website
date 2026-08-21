import { AdminRole } from "@prisma/client";
import { requireRole } from "@/server/auth/authorization";
import {
  getAdminRoleChangeFailure,
  type AdminRoleChangeFailure,
} from "@/server/admin/admin-role-policy";
import { changeAdminRoleAs } from "@/server/admin/admin-role-service";

export const runtime = "nodejs";

function errorResponse(failure: AdminRoleChangeFailure) {
  return Response.json(
    {
      error: failure.code,
      message: failure.message,
    },
    {
      status: failure.status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    input = undefined;
  }

  try {
    const actor = await requireRole(AdminRole.SUPER_ADMIN, {
      onUnauthenticated: "throw",
    });
    const admin = await changeAdminRoleAs(actor, input);

    return Response.json(
      { admin },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const failure = getAdminRoleChangeFailure(error);

    if (failure) {
      return errorResponse(failure);
    }

    throw error;
  }
}
