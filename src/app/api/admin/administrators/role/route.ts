import { AdminRole } from "@prisma/client";
import { requireRole } from "@/server/auth/authorization";
import {
  getAdminRoleChangeFailure,
  type AdminRoleChangeFailure,
} from "@/server/admin/admin-role-policy";
import { changeAdminRoleAs } from "@/server/admin/admin-role-service";
import { sameOriginFailureResponse } from "@/server/security/request-origin";

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
  const originFailure = sameOriginFailureResponse(request);

  if (originFailure) {
    return originFailure;
  }

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

    console.error("Administrator role change failed unexpectedly.");

    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: "تغییر نقش مدیر انجام نشد. دوباره تلاش کنید.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
