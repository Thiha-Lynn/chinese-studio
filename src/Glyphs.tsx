import { useEffect, useRef, useState } from "react";
import { Play, PenLine, RotateCcw, Volume2 } from "lucide-react";
import type HanziWriter from "hanzi-writer";
import type { Word, Progress } from "./types";
import { award, speak } from "./lib";
export default function Glyphs({
  words,
  progress,
  setProgress,
}: {
  words: Word[];
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
}) {
  const [selected, setSelected] = useState(words[0]?.id || ""),
    [index, setIndex] = useState(0),
    [status, setStatus] = useState(
      "Watch the strokes, then try them yourself.",
    ),
    [outline, setOutline] = useState(true),
    [ready, setReady] = useState(false);
  const target = useRef<HTMLDivElement>(null),
    writer = useRef<HanziWriter | null>(null);
  const word = words.find((w) => w.id === selected) || words[0],
    chars = [...new Set((word?.hanzi || "我").match(/[\u3400-\u9fff]/g) || [])],
    char = chars[index] || chars[0] || "我";
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setStatus("Loading stroke guide…");
    const el = target.current;
    if (!el) return;
    el.replaceChildren();
    import("hanzi-writer").then(({ default: Writer }) => {
      if (cancelled) return;
      writer.current = Writer.create(el, char, {
        width: 280,
        height: 280,
        padding: 22,
        strokeColor: "#173e6b",
        radicalColor: "#a7752d",
        outlineColor: "#cad3eb",
        drawingColor: "#173e6b",
        showOutline: outline,
        showCharacter: false,
        strokeAnimationSpeed: 0.8,
        charDataLoader: (_c, onLoad, onError) => {
          fetch(`/library/glyphs/${encodeURIComponent(char)}.json`)
            .then((r) => {
              if (!r.ok) throw new Error();
              return r.json();
            })
            .then((d) => {
              if (cancelled) return;
              onLoad(d);
              setReady(true);
              setStatus("Watch the strokes, then try them yourself.");
            })
            .catch(() => {
              if (!cancelled) {
                onError?.(new Error("Unavailable"));
                setStatus(
                  "No stroke guide for this character. Choose another.",
                );
              }
            });
        },
      });
    });
    return () => {
      cancelled = true;
      writer.current?.cancelQuiz();
      el.replaceChildren();
    };
  }, [char, outline]);
  function quiz() {
    setStatus("Draw in stroke order. A hint appears after two misses.");
    writer.current?.quiz({
      showHintAfterMisses: 2,
      onMistake: (s) =>
        setStatus(
          `Try that stroke again · ${s.strokesRemaining} strokes remain.`,
        ),
      onComplete: (s) => {
        setStatus(
          `Well done! ${char} complete with ${s.totalMistakes} ${s.totalMistakes === 1 ? "retry" : "retries"}.`,
        );
        setProgress((p) =>
          award(
            {
              ...p,
              glyphs: { ...p.glyphs, [char]: (p.glyphs[char] || 0) + 1 },
            },
            5,
          ),
        );
      },
    });
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">EXTRA PRACTICE · 写汉字</span>
        <h1>One stroke at a time.</h1>
        <p>Learn the movement. Feel the character. Make it yours.</p>
      </div>
      <div className="glyph-layout">
        <section className="panel">
          <label className="field-label" htmlFor="glyph-word">
            Choose a word
          </label>
          <select
            id="glyph-word"
            value={word?.id}
            onChange={(e) => {
              setSelected(e.target.value);
              setIndex(0);
            }}
          >
            {words.map((w) => (
              <option key={w.id} value={w.id}>
                {w.hanzi} · {w.pinyin}
              </option>
            ))}
          </select>
          <div className="characters">
            {chars.map((c, i) => (
              <button
                key={c}
                className={i === index ? "active" : ""}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                {c}
              </button>
            ))}
          </div>
          <h2 className="hanzi">{word?.hanzi}</h2>
          <p className="pinyin">{word?.pinyin}</p>
          <p>{word?.meaning}</p>
          <button
            className="btn secondary"
            onClick={() => speak(word?.audioText || word?.hanzi)}
          >
            <Volume2 size={17} /> Listen
          </button>
          <div className="soft-note">
            <strong>Keep a comfortable rhythm.</strong>
            <p>
              Use a finger, stylus, or mouse. Start with the outline, then hide
              it when you’re ready.
            </p>
          </div>
        </section>
        <section className="panel glyph-main">
          <div
            className="writing-grid"
            ref={target}
            aria-label={`Stroke practice canvas for ${char}`}
          />
          <div className="row center">
            <button
              className="btn secondary"
              disabled={!ready}
              onClick={() => {
                writer.current?.cancelQuiz();
                writer.current?.animateCharacter();
                setStatus("Follow the stroke order.");
              }}
            >
              <Play size={17} /> Watch
            </button>
            <button className="btn" disabled={!ready} onClick={quiz}>
              <PenLine size={17} /> Your turn
            </button>
            <button
              className="icon-button"
              disabled={!ready}
              onClick={quiz}
              aria-label="Restart character"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={outline}
              onChange={(e) => setOutline(e.target.checked)}
            />{" "}
            Show character outline
          </label>
          <p role="status">{status}</p>
          <small>
            {progress.glyphs[char] || 0} completed · Stroke data: Make Me a
            Hanzi / Hanzi Writer, Arphic Public License. This is an added
            practice tool.
          </small>
        </section>
      </div>
    </>
  );
}
