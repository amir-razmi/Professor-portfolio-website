export const AuthorizationErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
} as const;

export type AuthorizationErrorCode =
  (typeof AuthorizationErrorCode)[keyof typeof AuthorizationErrorCode];

export type AuthorizationFailure = {
  code: AuthorizationErrorCode;
  message: string;
  status: 401 | 403;
};

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;
  readonly status: 401 | 403;

  constructor(code: AuthorizationErrorCode, message: string, status: 401 | 403) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AuthorizationError {
  constructor() {
    super(AuthorizationErrorCode.UNAUTHORIZED, "برای ادامه باید وارد شوید.", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthorizationError {
  constructor() {
    super(AuthorizationErrorCode.FORBIDDEN, "دسترسی کافی ندارید.", 403);
    this.name = "ForbiddenError";
  }
}

export function getAuthorizationFailure(error: unknown): AuthorizationFailure | null {
  if (!(error instanceof AuthorizationError)) {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    status: error.status,
  };
}
