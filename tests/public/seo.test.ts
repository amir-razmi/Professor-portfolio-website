import assert from "node:assert/strict";
import test from "node:test";

import robots from "../../src/app/robots";
import { createPublicMetadata } from "../../src/lib/seo";

test("public metadata includes canonical, Open Graph, and Twitter fields", () => {
  const metadata = createPublicMetadata({
    title: "Research",
    description: "Public research projects.",
    path: "/research",
    imageUrl: "https://images.example.test/profile.jpg",
  });

  assert.equal(metadata.alternates?.canonical, "/research");
  assert.equal(metadata.openGraph?.title, "Research");
  assert.equal(metadata.openGraph?.url, "/research");
  assert.equal(
    metadata.twitter && "card" in metadata.twitter ? metadata.twitter.card : undefined,
    "summary_large_image",
  );
  assert.deepEqual(metadata.openGraph?.images, [
    {
      url: "https://images.example.test/profile.jpg",
      alt: "Research",
    },
  ]);
});

test("robots allows public routes and blocks administrative/API routes", () => {
  const rules = robots().rules;
  assert.equal(Array.isArray(rules), false);

  if (Array.isArray(rules)) {
    return;
  }

  assert.deepEqual(rules.allow, [
    "/",
    "/about",
    "/research",
    "/publications",
    "/blog",
    "/files",
    "/contact",
  ]);
  assert.deepEqual(rules.disallow, ["/admin/", "/api/", "/login"]);
});
