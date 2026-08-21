import assert from "node:assert/strict";
import test from "node:test";

import { performLogout } from "../../src/server/auth/logout";
import { safeAuthRedirect } from "../../src/server/auth/redirect";

test("Auth.js redirects stay on the configured origin", () => {
  assert.equal(
    safeAuthRedirect("/admin/dashboard", "https://portfolio.example.test"),
    "https://portfolio.example.test/admin/dashboard",
  );
  assert.equal(
    safeAuthRedirect(
      "https://portfolio.example.test/login?reason=expired",
      "https://portfolio.example.test",
    ),
    "https://portfolio.example.test/login?reason=expired",
  );
  assert.equal(
    safeAuthRedirect("https://attacker.example.test/phishing", "https://portfolio.example.test"),
    "https://portfolio.example.test/admin",
  );
  assert.equal(
    safeAuthRedirect("//attacker.example.test/phishing", "https://portfolio.example.test"),
    "https://portfolio.example.test/admin",
  );
});

test("logout delegates to Auth.js with a fixed local destination", async () => {
  let received: { redirectTo: string } | null = null;

  await performLogout(async (options) => {
    received = options;
  });

  assert.deepEqual(received, { redirectTo: "/login" });
});
