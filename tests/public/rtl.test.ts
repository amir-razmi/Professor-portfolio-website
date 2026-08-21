import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("root document and global styles configure Persian RTL", async () => {
  const [layout, styles, config] = await Promise.all([
    readFile("src/app/layout.tsx", "utf8"),
    readFile("src/app/globals.css", "utf8"),
    readFile("src/config/site.ts", "utf8"),
  ]);

  assert.match(layout, /lang="fa"/);
  assert.match(layout, /dir="rtl"/);
  assert.match(styles, /direction:\s*rtl/);
  assert.match(config, /خانه/);
  assert.match(config, /درباره/);
});
