import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import {
  choicesFor,
  selectionCorrect,
  normalizedAnswer,
  sentenceAnswers,
  sentenceCorrect,
} from "../src/chinese1-data.ts";
import { parseProgress } from "../src/progress.ts";
import { freshProgress } from "../src/types.ts";
const data = JSON.parse(readFileSync("content/chinese1.json", "utf8"));
test("Chinese 1 graph preserves all chapters, source types and explicit missing references", () => {
  assert.equal(data.lessons.length, 10);
  assert.equal(data.stats.nodes, 1249);
  assert.equal(data.stats.questions, 582);
  assert.equal(data.stats.pages, 1152);
  const gaps = new Set(data.gaps.map((g: any) => g.code));
  assert.deepEqual([...gaps].sort(), ["CTA01-183", "LKA01-21", "LKT04-9"]);
  function walk(v: any) {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (
          k === "action" &&
          typeof x === "string" &&
          /^[A-Z]{2,5}\d{2}-\d/.test(x)
        )
          assert.ok(data.nodes[x] || gaps.has(x), x);
        walk(x);
      }
  }
  for (const n of Object.values(data.nodes) as any[]) {
    for (const c of n.children) assert.ok(data.nodes[c] || gaps.has(c), c);
    walk(n.templates);
  }
  const index = JSON.parse(
    readFileSync("content/chinese1-lessons.json", "utf8"),
  );
  assert.equal(index.length, data.lessons.length);
  for (const l of data.lessons) {
    assert.deepEqual(
      index.find((x: any) => x.id === l.id),
      {
        ...l,
        art: data.media[l.art],
        words: data.vocab.filter((w: any) => w.lesson === l.id).length,
      },
    );
    assert.ok(l.chapters > 0);
    assert.ok(l.pages > 0);
    assert.ok(data.vocab.some((w: any) => w.lesson === l.id));
  }
});
test("archived media and Classroom files exist locally with verified sizes", () => {
  assert.equal(data.stats.mediaFailed, 1);
  assert.equal(data.stats.mediaDownloaded, 1215);
  const manifest = JSON.parse(
    readFileSync("library/chinese1/media-manifest.json", "utf8"),
  );
  for (const r of manifest.filter((r: any) => r.status === "downloaded")) {
    assert.equal(statSync("library/chinese1/media/" + r.file).size, r.bytes);
    assert.match(r.sha256, /^[0-9a-f]{64}$/);
  }
  assert.equal(data.classroom.resources.filter((r: any) => r.url).length, 7);
  assert.equal(
    data.classroom.resources.filter((r: any) => r.status === "source-404")
      .length,
    49,
  );
  for (const r of data.classroom.resources)
    if (r.url) assert.ok(statSync("." + r.url).size > 0);
});
test("original activity keys and Chinese 1 progress work independently of Chinese 2", () => {
  const q = data.nodes["IAM05-1"].templates[0].content.question[0];
  assert.equal(choicesFor(q)[2].item?.data, "m");
  assert.equal(selectionCorrect(q, [2]), true);
  assert.equal(selectionCorrect(q, [1]), false);
  assert.equal(selectionCorrect(q, [1, 2]), false);
  assert.equal(
    normalizedAnswer("她 是 谁？"),
    normalizedAnswer(data.nodes["IAM08-1"].answers.correctAnswers[0].answer),
  );
  for (const code of ["IAM08-29", "IAM08-32", "IAM08-36", "IAM08-37"]) {
    const node = data.nodes[code],
      question = node.templates[0].content.question[0];
    const answers = sentenceAnswers(node, question);
    assert.equal(answers.length, 2);
    for (const answer of answers)
      assert.equal(sentenceCorrect(answers, answer), true);
    assert.equal(sentenceCorrect(answers, "不正确"), false);
  }
  const alternatives = data.nodes["IAM05-286"].templates[0].content.question[0];
  assert.equal(selectionCorrect(alternatives, [0]), true);
  assert.equal(selectionCorrect(alternatives, [2]), true);
  assert.equal(selectionCorrect(alternatives, [1]), false);
  assert.equal(selectionCorrect(alternatives, [0, 2]), false);
  assert.equal(
    selectionCorrect({ ...alternatives, multiSelect: true }, [0, 2]),
    true,
  );
  assert.equal(
    selectionCorrect({ ...alternatives, multiSelect: true }, [0]),
    false,
  );
  const ids = data.vocab.map((w: any) => w.id);
  assert.equal(new Set(ids).size, 182);
  assert.ok(ids.every((id: string) => id.startsWith("c1-")));
  assert.ok(
    parseProgress({
      ...freshProgress(),
      known: { [ids[0]]: true },
      answers: {
        "c1:read:CTA04-1": "done",
        "c1:IAM05-1:q0": JSON.stringify({ selected: [2], correct: true }),
      },
    }),
  );
});
