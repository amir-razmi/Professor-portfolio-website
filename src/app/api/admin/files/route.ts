import { Permission, requirePermission } from "@/server/auth/authorization";
import { getAuthorizationFailure } from "@/server/auth/authorization-error";

import { fileErrorResponse } from "@/features/files/server/file-errors";
import { fileMetadataFormDataToInput, MAX_FILE_SIZE_BYTES } from "@/features/files/file-schema";
import { listAdminFiles, uploadFile } from "@/features/files/server/file-service";
import { serializeAdminFile } from "@/features/files/server/file-serialization";
import { sameOriginFailureResponse } from "@/server/security/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_UPLOAD_REQUEST_BYTES = MAX_FILE_SIZE_BYTES + 1024 * 1024;

function authOrFileError(error: unknown): Response {
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

export async function GET() {
  try {
    const actor = await requirePermission(Permission.MANAGE_FILES, {
      onUnauthenticated: "throw",
    });
    const files = await listAdminFiles(actor);

    return Response.json(
      { files: files.map(serializeAdminFile) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authOrFileError(error);
  }
}

export async function POST(request: Request) {
  const originFailure = sameOriginFailureResponse(request);

  if (originFailure) {
    return originFailure;
  }

  try {
    const actor = await requirePermission(Permission.MANAGE_FILES, {
      onUnauthenticated: "throw",
    });

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;

    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_REQUEST_BYTES) {
      return Response.json(
        {
          error: "INVALID_INPUT",
          message: "حجم درخواست بارگذاری بیش از حد مجاز است.",
          fieldErrors: { file: ["حجم فایل باید حداکثر ۱۰ مگابایت باشد."] },
        },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return Response.json(
        {
          error: "INVALID_INPUT",
          message: "یک فایل برای بارگذاری انتخاب کنید.",
          fieldErrors: { file: ["یک فایل برای بارگذاری انتخاب کنید."] },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const file = await uploadFile(actor, fileValue, fileMetadataFormDataToInput(formData));

    return Response.json(
      { file: serializeAdminFile(file) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authOrFileError(error);
  }
}
