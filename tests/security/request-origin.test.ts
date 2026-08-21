import assert from "node:assert/strict";
import test from "node:test";

import {
  isSameOriginRequest,
  sameOriginFailureResponse,
} from "../../src/server/security/request-origin";

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://portfolio.example.test/api/admin/files", {
    method: "POST",
    headers,
  });
}

test("same-origin mutation requests are accepted using Origin or Referer", async () => {
  const originRequest = request({ Origin: "https://portfolio.example.test" });
  const refererRequest = request({
    Referer: "https://portfolio.example.test/admin/files",
  });

  assert.equal(isSameOriginRequest(originRequest), true);
  assert.equal(isSameOriginRequest(refererRequest), true);
  assert.equal(sameOriginFailureResponse(originRequest), null);
  assert.equal(sameOriginFailureResponse(refererRequest), null);
});

test("cross-origin and headerless mutations are rejected without revealing internals", async () => {
  const crossOrigin = sameOriginFailureResponse(
    request({ Origin: "https://attacker.example.test" }),
  );
  const headerless = sameOriginFailureResponse(request());

  assert.ok(crossOrigin);
  assert.ok(headerless);
  assert.equal(crossOrigin.status, 403);
  assert.equal(headerless.status, 403);
  assert.deepEqual(await crossOrigin.json(), {
    error: "FORBIDDEN",
    message: "منبع درخواست معتبر نیست.",
  });
});

test("malformed Referer values fail closed", () => {
  assert.equal(isSameOriginRequest(request({ Referer: "not-a-url" })), false);
});
