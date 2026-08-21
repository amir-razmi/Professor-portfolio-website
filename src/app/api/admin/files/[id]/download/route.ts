import { Permission, requirePermission } from "@/server/auth/authorization";
import { getAuthorizationFailure } from "@/server/auth/authorization-error";

import { fileErrorResponse } from "@/features/files/server/file-errors";
import { createFileDownloadResponse } from "@/features/files/server/file-download";
import { getAdminFileDownload } from "@/features/files/server/file-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await requirePermission(Permission.MANAGE_FILES, {
      onUnauthenticated: "throw",
    });
    const { id } = await context.params;
    const result = await getAdminFileDownload(actor, id);

    return createFileDownloadResponse(result, "no-store");
  } catch (error) {
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
}
