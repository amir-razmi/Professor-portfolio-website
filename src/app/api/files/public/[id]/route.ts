import { getPublicFileDownload } from "@/features/files/server/file-service";
import { createFileDownloadResponse } from "@/features/files/server/file-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await getPublicFileDownload(id);

  if (!result) {
    return new Response("Not found.", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return createFileDownloadResponse(result, "no-store");
}
