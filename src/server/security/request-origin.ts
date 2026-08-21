const invalidOriginMessage = "منبع درخواست معتبر نیست.";

function configuredOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) {
    return null;
  }

  try {
    const parsed = new URL(configured);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function requestOrigin(request: Request): string | null {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function expectedOrigins(request: Request): Set<string> {
  return new Set(
    [requestOrigin(request), configuredOrigin()].filter((origin): origin is string =>
      Boolean(origin),
    ),
  );
}

/**
 * Browser mutations must carry an Origin or Referer header that resolves to
 * the application's origin. Auth.js protects its own endpoints separately;
 * this guard covers custom cookie-authenticated route handlers.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origins = expectedOrigins(request);
  const originHeader = request.headers.get("origin")?.trim();

  if (originHeader) {
    return origins.has(originHeader);
  }

  const refererHeader = request.headers.get("referer")?.trim();

  if (!refererHeader) {
    return false;
  }

  try {
    return origins.has(new URL(refererHeader).origin);
  } catch {
    return false;
  }
}

export function sameOriginFailureResponse(request: Request): Response | null {
  if (isSameOriginRequest(request)) {
    return null;
  }

  return Response.json(
    {
      error: "FORBIDDEN",
      message: invalidOriginMessage,
    },
    {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
