import type { Word } from "./types";
export type Lang = Record<string, string>;
export type SourceItem = {
  type?: number;
  data?: string;
  comment?: string;
  item?: SourceItem;
  title?: Lang;
  score?: number;
  refCode?: string | null;
};
export type SourceQuestion = {
  item: SourceItem[];
  choices: { choice: { choices: SourceItem } }[];
  title?: Lang;
  desciption?: Lang;
  multiSelect?: boolean;
};
export type SourceTemplate = {
  type: number;
  title?: Lang;
  description?: Lang;
  content: any;
  navigate?: Record<
    string,
    { action?: string; enable?: boolean; title?: Lang }
  >;
};
export type SourceNode = {
  code: string;
  lesson: number;
  parent?: string;
  children: string[];
  kind: string;
  templates: SourceTemplate[];
  answers?: { correctAnswers: { answer: string; score: number }[] };
};
export type Chinese1Data = {
  capturedAt: string;
  source: string;
  lessons: {
    id: number;
    code: string;
    title: Lang;
    art: string;
    chapters: number;
    pages: number;
  }[];
  nodes: Record<string, SourceNode>;
  vocab: (Word & { code: string; audio?: string })[];
  media: Record<string, string>;
  mediaGaps: { source: string; error: string }[];
  classroom: {
    source: string;
    resources: {
      id: string;
      name: string;
      category: string;
      status: string;
      source: string;
      url?: string;
      detail?: string;
    }[];
  };
  gaps: { code: string; error: string }[];
  stats: Record<string, number>;
};
export function textFor(value: Lang | undefined, lang = "EN"): string {
  if (!value || Array.isArray(value)) return "";
  return (
    value[lang] || value.EN || value.CN || value.TH || value["PIN IN"] || ""
  );
}
export function nodeTitle(node: SourceNode, lang = "EN"): string {
  if (node.code === "HP02-0") return "Pre-test practice collection";
  if (node.code === "HP02-11") return "Post-test practice collection";
  for (const t of node.templates) {
    const s = textFor(t.title, lang) || textFor(t.content?.title, lang);
    if (s) return s;
  }
  return node.kind === "topic"
    ? "Chapter contents"
    : node.kind === "assignment"
      ? "Practice collection"
      : "Learning activity";
}
export function normalizedAnswer(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\s+/g, "")
    .replace(/[，,。.!！?？]/g, "")
    .toLowerCase();
}
export function choicesFor(q: SourceQuestion): SourceItem[] {
  return q.choices.map((c) => c.choice.choices);
}
export function selectionCorrect(
  q: SourceQuestion,
  selected: number[],
): boolean | null {
  const expected = choicesFor(q).flatMap((c, i) =>
    (c.score || 0) > 0 ? [i] : [],
  );
  if (!expected.length) return null;
  if (!q.multiSelect)
    return selected.length === 1 && expected.includes(selected[0]);
  return (
    expected.length === selected.length &&
    expected.every((i) => selected.includes(i))
  );
}

export function sentenceAnswers(node: SourceNode, q: SourceQuestion): string[] {
  const source =
    node.answers?.correctAnswers
      ?.filter((a) => a.score > 0 && a.answer.trim())
      .map((a) => a.answer) || [];
  return source.length
    ? source
    : q.item
        .filter((i) => (i.score || 0) > 0 && i.item?.data)
        .map((i) => i.item!.data!);
}
export function sentenceCorrect(
  answers: string[],
  entered: string,
): boolean | null {
  return answers.length
    ? answers.some((a) => normalizedAnswer(a) === normalizedAnswer(entered))
    : null;
}
