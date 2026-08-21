import { cookies } from "next/headers";

import { objectIdIsSafe } from "@/features/files/file-schema";
import { fileAccessCookieName } from "@/features/files/server/file-access-token";
import { getPublicFileDownload } from "@/features/files/server/file-service";
import { createFileDownloadResponse } from "@/features/files/server/file-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const accessToken = objectIdIsSafe(id)
      ? (await cookies()).get(fileAccessCookieName(id))?.value
      : undefined;
    const result = await getPublicFileDownload(id, accessToken);

    if (result) {
      return createFileDownloadResponse(result, "no-store");
    }
  } catch {
    // Do not expose storage or database details through a public download URL.
  }

  return new Response("Not found.", {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
