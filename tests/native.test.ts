import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const { resolveResource } = createRequire(import.meta.url)(
  "../native/desktop/paths.cjs",
);
test("desktop protocol only exposes bundled files and internal routes", () => {
  const root = path.resolve("build/client");
  assert.equal(
    resolveResource(root, "studio://app/lesson/10"),
    path.join(root, "index.html"),
  );
  assert.equal(
    resolveResource(root, "studio://app/library/resources/Lesson%201.pdf"),
    path.join(root, "library/resources/Lesson 1.pdf"),
  );
  assert.equal(resolveResource(root, "studio://app/api/session"), null);
  for (const url of [
    "https://app/index.html",
    "studio://other/index.html",
    "studio://app/..%2f..%2fprivate",
    "studio://app/%5c..%5cprivate",
  ])
    assert.throws(() => resolveResource(root, url));
});
