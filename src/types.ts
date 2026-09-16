export type Word = {
  id: string;
  lesson: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  image?: string;
  source?: string;
  note?: string;
  audioText?: string;
};
export type Resource = { name: string; url: string; kind: string };
export type Lesson = {
  id: number;
  title: string;
  hanzi: string;
  theme: string;
  art: string;
  grammar: string[][];
  slides: { part: string; text: string }[];
  resources: Resource[];
  summaries: string[];
  dialogue?: string[];
  coverage?: string;
};
export type OralGroup = {
  lesson: number;
  id: string;
  topic?: string;
  title?: string;
  questions: any[];
  answer?: any;
  [key: string]: any;
};
export type Course = {
  lessons: Lesson[];
  vocab: Word[];
  exam: any;
  coverage: { area: string; status: string; detail: string }[];
};
export type User = {
  id: string;
  name: string;
  email: string;
  preview?: boolean;
};
export type Progress = {
  known: Record<string, boolean>;
  wrong: Record<string, number>;
  reviews: Record<string, { due: number; interval: number }>;
  answers: Record<string, string>;
  history: { date: string; type: string; score: number; total: number }[];
  xp: number;
  streakDates: string[];
  glyphs: Record<string, number>;
};
export const freshProgress = (): Progress => ({
  known: {},
  wrong: {},
  reviews: {},
  answers: {},
  history: [],
  xp: 0,
  streakDates: [],
  glyphs: {},
});
