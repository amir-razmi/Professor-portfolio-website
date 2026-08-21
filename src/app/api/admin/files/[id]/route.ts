import { Permission, requirePermission } from "@/server/auth/authorization";
import { getAuthorizationFailure } from "@/server/auth/authorization-error";

import { fileErrorResponse } from "@/features/files/server/file-errors";
import { updateFileMetadata } from "@/features/files/server/file-service";
import { serializeAdminFile } from "@/features/files/server/file-serialization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown): Response {
  const authorization = getAuthorizationFailure(error);

  if (authorization) {
    return Response.json(
      { error: authorization.code, message: authorization.message },
      { status: authorization.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const failure = fileErrorResponse(error);

  return Response.json(
    {
      error: failure.code,
      message: failure.message,
      fieldErrors: failure.fieldErrors,
    },
    { status: failure.status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requirePermission(Permission.MANAGE_FILES, {
      onUnauthenticated: "throw",
    });
    const { id } = await context.params;
    let input: unknown;

    try {
      input = await request.json();
    } catch {
      input = undefined;
    }

    const file = await updateFileMetadata(actor, id, input);

    return Response.json(
      {
        file: serializeAdminFile(file),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
