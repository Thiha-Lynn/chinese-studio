import { z } from "zod";
// Keep validation compatible with strict Content Security Policy.
z.config({ jitless: true });
export const progressSchema = z.object({
  known: z.record(z.string().max(80), z.boolean()),
  wrong: z.record(z.string().max(80), z.number().int().min(0).max(100000)),
  reviews: z.record(
    z.string().max(80),
    z.object({
      due: z.number().nonnegative(),
      interval: z.number().nonnegative().max(3660),
    }),
  ),
  answers: z.record(z.string().max(80), z.string().max(2000)),
  history: z
    .array(
      z.object({
        date: z.string().max(40),
        type: z.string().max(40),
        score: z.number().nonnegative().max(10000),
        total: z.number().nonnegative().max(10000),
      }),
    )
    .max(200),
  xp: z.number().int().nonnegative().max(10000000),
  streakDates: z.array(z.string().max(10)).max(3660),
  glyphs: z.record(
    z.string().max(2),
    z.number().int().nonnegative().max(100000),
  ),
});
export function parseProgress(value: unknown) {
  return progressSchema.parse(value);
}
