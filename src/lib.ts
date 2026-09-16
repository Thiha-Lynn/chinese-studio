import type { Progress } from "./types";
export async function api<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const r = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const d = await r.json();
  if (!r.ok)
    throw new Error(d.error || "Something went wrong. Please try again.");
  return d;
}
export const asset = (s: string) =>
  s.startsWith("/library/") ? s : "/library/" + s;
export function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const day = () => new Date().toLocaleDateString("en-CA");
export function award(p: Progress, xp: number): Progress {
  return {
    ...p,
    xp: p.xp + xp,
    streakDates: [...new Set([...p.streakDates, day()])].slice(-3660),
  };
}
export function review(p: Progress, id: string, good: boolean): Progress {
  const interval = good
    ? Math.min(
        3660,
        Math.max(1, Math.round((p.reviews[id]?.interval || 0.4) * 2.5)),
      )
    : 0;
  return award(
    {
      ...p,
      known: { ...p.known, [id]: good },
      wrong: { ...p.wrong, [id]: good ? 0 : (p.wrong[id] || 0) + 1 },
      reviews: {
        ...p.reviews,
        [id]: {
          interval,
          due: Date.now() + (good ? interval * 86400000 : 600000),
        },
      },
    },
    good ? 3 : 1,
  );
}
export function speak(text: string, onError?: (t: string) => void) {
  if (!("speechSynthesis" in window)) {
    onError?.("Speech playback is not available in this browser.");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.78;
  u.voice =
    speechSynthesis.getVoices().find((v) => v.lang === "zh-CN") ||
    speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh")) ||
    null;
  u.onerror = () =>
    onError?.(
      "Could not play speech. Check your device’s Chinese voice settings.",
    );
  speechSynthesis.speak(u);
}
export const normalizePinyin = (s: string) =>
  s
    .toLowerCase()
    .replace(/u:/g, "v")
    .normalize("NFD")
    .replace(/u\u0308/g, "v")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s.,!?，。？！·’']/g, "")
    .replace(/ɑ/g, "a")
    .replace(/ɡ/g, "g");
