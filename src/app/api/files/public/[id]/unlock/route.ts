import { cookies } from "next/headers";

import { objectIdIsSafe } from "@/features/files/file-schema";
import {
  FILE_ACCESS_COOKIE_MAX_AGE_SECONDS,
  fileAccessCookieName,
} from "@/features/files/server/file-access-token";
import { fileErrorResponse } from "@/features/files/server/file-errors";
import { unlockFile } from "@/features/files/server/file-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!objectIdIsSafe(id)) {
    return Response.json(
      {
        error: "INVALID_INPUT",
        message: "باز کردن دسترسی این فایل با گذرواژه ممکن نشد.",
        fieldErrors: { password: ["گذرواژه نادرست است."] },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    let input: unknown;

    try {
      input = await request.json();
    } catch {
      input = undefined;
    }

    const result = await unlockFile(id, input);
    const cookieStore = await cookies();

    cookieStore.set({
      name: fileAccessCookieName(id),
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/api/files/public/${id}`,
      maxAge: FILE_ACCESS_COOKIE_MAX_AGE_SECONDS,
      expires: result.expiresAt,
    });

    return Response.json(
      {
        unlocked: true,
        downloadUrl: `/api/files/public/${id}`,
        expiresAt: result.expiresAt.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
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
