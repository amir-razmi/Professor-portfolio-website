import { isSafeFileType } from "../file-schema";
import type { FileRecord } from "./file-policy";

type DownloadObject = {
  body: ReadableStream<Uint8Array>;
  sizeBytes: number;
};

export function createFileDownloadResponse(
  result: { file: FileRecord; object: DownloadObject },
  cacheControl: string,
): Response {
  const filename = result.file.safeOriginalName;
  const fallback = filename.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");

  return new Response(result.object.body, {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(result.object.sizeBytes),
      "Content-Security-Policy": "sandbox",
      "Content-Type": isSafeFileType(result.file.fileType)
        ? result.file.fileType
        : "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
