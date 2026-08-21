export class FileOperationError extends Error {
  readonly code: "INVALID_INPUT" | "NOT_FOUND" | "STORAGE_UNAVAILABLE" | "CLEANUP_FAILED";

  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    code: FileOperationError["code"] = "INVALID_INPUT",
    fieldErrors: Record<string, string[] | undefined> = {},
  ) {
    super(message);
    this.name = "FileOperationError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function fileErrorResponse(error: unknown): {
  code: string;
  fieldErrors: Record<string, string[] | undefined>;
  message: string;
  status: number;
} {
  if (error instanceof FileOperationError) {
    return {
      code: error.code,
      fieldErrors: error.fieldErrors,
      message: error.message,
      status:
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "STORAGE_UNAVAILABLE" || error.code === "CLEANUP_FAILED"
            ? 503
            : 400,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    fieldErrors: {},
    message: "The file request could not be completed.",
    status: 500,
  };
}
