import {
  getAuthorizationFailure,
  type AuthorizationFailure,
} from "@/server/auth/authorization-error";

export type FieldErrors = Record<string, string[] | undefined>;

export const ContentValidationErrorCode = {
  INVALID_INPUT: "INVALID_INPUT",
} as const;

export type ContentValidationErrorCode =
  (typeof ContentValidationErrorCode)[keyof typeof ContentValidationErrorCode];

export class ContentValidationError extends Error {
  readonly code = ContentValidationErrorCode.INVALID_INPUT;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors) {
    super(message);
    this.name = "ContentValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export type ContentMutationFailure =
  | AuthorizationFailure
  | {
      code: ContentValidationErrorCode;
      message: string;
      fieldErrors: FieldErrors;
    };

export function getContentMutationFailure(error: unknown): ContentMutationFailure | null {
  const authorizationFailure = getAuthorizationFailure(error);

  if (authorizationFailure) {
    return authorizationFailure;
  }

  if (!(error instanceof ContentValidationError)) {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    fieldErrors: error.fieldErrors,
  };
}
