import { createHmac, timingSafeEqual } from "node:crypto";

export const FILE_ACCESS_COOKIE_MAX_AGE_SECONDS = 15 * 60;

function configuredSecret(secret?: string): string {
  const value = secret ?? process.env.AUTH_SECRET;

  if (!value || value.trim().length < 32) {
    throw new Error(
      "Invalid authentication environment: AUTH_SECRET must be at least 32 characters.",
    );
  }

  return value.trim();
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signedPayload(payload: string, secret: string): string {
  return `${payload}.${signature(payload, secret)}`;
}

export function fileAccessCookieName(fileId: string): string {
  return `file-access-${fileId}`;
}

export function createFileAccessToken(
  fileId: string,
  passwordVersion: string,
  now = Date.now(),
  secret = configuredSecret(),
): string {
  const payload = encode(
    JSON.stringify({
      v: 1,
      fileId,
      passwordVersion,
      exp: Math.floor(now / 1000) + FILE_ACCESS_COOKIE_MAX_AGE_SECONDS,
    }),
  );

  return signedPayload(payload, secret);
}

export function verifyFileAccessToken(
  token: string,
  fileId: string,
  passwordVersion: string,
  now = Date.now(),
  secret = configuredSecret(),
): boolean {
  const [payload, providedSignature, ...extra] = token.split(".");

  if (!payload || !providedSignature || extra.length) {
    return false;
  }

  const expectedSignature = signature(payload, secret);
  const providedBytes = Buffer.from(providedSignature, "base64url");
  const expectedBytes = Buffer.from(expectedSignature, "base64url");

  if (
    providedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(providedBytes, expectedBytes)
  ) {
    return false;
  }

  const decoded = decode(payload);

  if (!decoded) {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(decoded);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("v" in parsed) ||
      !("fileId" in parsed) ||
      !("passwordVersion" in parsed) ||
      !("exp" in parsed) ||
      parsed.v !== 1 ||
      parsed.fileId !== fileId ||
      parsed.passwordVersion !== passwordVersion ||
      typeof parsed.exp !== "number" ||
      !Number.isSafeInteger(parsed.exp)
    ) {
      return false;
    }

    return parsed.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}
