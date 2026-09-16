import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { progressSchema } from "../src/progress.ts";
import { freshProgress } from "../src/types.ts";
import { allowedIdentity, sameOrigin } from "../server/policy.ts";
const course = JSON.parse(readFileSync("content/course.json", "utf8"));
test("all ten lessons have source text, exercises and real files", () => {
  assert.equal(course.lessons.length, 10);
  assert.equal(course.vocab.length, 249);
  assert.equal(new Set(course.vocab.map((w: any) => w.id)).size, 249);
  assert.equal(
    course.lessons.reduce((n: number, l: any) => n + l.slides.length, 0),
    485,
  );
  for (const l of course.lessons) {
    assert.ok(l.slides.length > 20);
    assert.ok(l.grammar.length);
    assert.ok(course.vocab.some((w: any) => w.lesson === l.id));
    for (const resource of l.resources)
      assert.ok(existsSync(path.join(".", resource.url)), resource.url);
  }
  for (const w of course.vocab)
    if (w.image) assert.ok(existsSync(path.join(".", w.image)), w.image);
});
test("progress rejects damaged or unexpectedly shaped imports", () => {
  assert.ok(progressSchema.safeParse(freshProgress()).success);
  assert.ok(!progressSchema.safeParse({ xp: 9 }).success);
  assert.ok(!progressSchema.safeParse({ ...freshProgress(), xp: -1 }).success);
  assert.ok(
    !progressSchema.safeParse({
      ...freshProgress(),
      answers: { a: "x".repeat(2001) },
    }).success,
  );
  assert.ok(
    !progressSchema.safeParse({ ...freshProgress(), known: { a: "true" } })
      .success,
  );
});
test("Google identity policy uses verified claims and exact hosted domains", () => {
  const claims = {
    sub: "sample",
    email: "sample@lamduan.mfu.ac.th",
    email_verified: true,
    hd: "lamduan.mfu.ac.th",
  };
  assert.equal(allowedIdentity(claims, "google", []), true);
  assert.equal(
    allowedIdentity({ ...claims, email_verified: false }, "google", []),
    false,
  );
  assert.equal(allowedIdentity(claims, "mfu", ["lamduan.mfu.ac.th"]), true);
  assert.equal(
    allowedIdentity({ ...claims, hd: undefined }, "mfu", ["lamduan.mfu.ac.th"]),
    false,
  );
  assert.equal(
    allowedIdentity({ ...claims, hd: "elsewhere.example" }, "mfu", [
      "lamduan.mfu.ac.th",
    ]),
    false,
  );
  assert.ok(sameOrigin("https://study.example", "https://study.example"));
  assert.ok(!sameOrigin(undefined, "https://study.example"));
});

import { normalizePinyin } from "../src/lib.ts";
test("pinyin accepts tone-marked ü, v and u: consistently", () => {
  for (const s of ["lǚ", "lü", "lv", "lu:"])
    assert.equal(normalizePinyin(s), "lv");
  assert.notEqual(normalizePinyin("lù"), normalizePinyin("lǚ"));
  assert.equal(normalizePinyin("Tiān’ānmén"), normalizePinyin("tian'anmen"));
});
