export function safeAuthRedirect(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);

    if (url.startsWith("/") && !url.startsWith("//")) {
      return new URL(url, base).toString();
    }

    const target = new URL(url);

    if (target.origin === base.origin) {
      return target.toString();
    }
  } catch {
    // Fall through to the safe admin destination.
  }

  return new URL("/admin", baseUrl).toString();
}
