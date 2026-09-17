import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  RotateCcw,
  Volume2,
  Layers,
  Headphones,
  Keyboard,
  SpellCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import type { Course, Progress, Word } from "./types";
import { award, normalizePinyin, review, shuffle, speak } from "./lib";
const modes = [
  {
    id: "flash",
    name: "Flip & remember",
    hint: "A little surprise on every card.",
    icon: Layers,
  },
  {
    id: "meaning",
    name: "Find the meaning",
    hint: "Connect the word to its meaning.",
    icon: CheckCircle2,
  },
  {
    id: "listen",
    name: "Listen closely",
    hint: "Hear it, then find the characters.",
    icon: Headphones,
  },
  {
    id: "pinyin",
    name: "Type the pinyin",
    hint: "Connect characters and sounds.",
    icon: Keyboard,
  },
  {
    id: "sentence",
    name: "Build a sentence",
    hint: "Put the characters in the right order.",
    icon: SpellCheck,
  },
  {
    id: "review",
    name: "A little refresh",
    hint: "Revisit words that need another look.",
    icon: RefreshCw,
  },
];
type Props = {
  course: Course;
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
  initialLesson?: number;
};
export default function Practice({
  course,
  progress,
  setProgress,
  initialLesson = 0,
}: Props) {
  const [lesson, setLesson] = useState(initialLesson),
    [mode, setMode] = useState(""),
    [deck, setDeck] = useState<Word[]>([]),
    [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [answer, setAnswer] = useState(""),
    [answered, setAnswered] = useState(false),
    [correct, setCorrect] = useState(false),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false),
    [error, setError] = useState(""),
    [pieces, setPieces] = useState<number[]>([]);
  const pool = course.vocab.filter((w) => !lesson || w.lesson === lesson);
  const word = deck[index];
  const sentence =
    course.lessons.find((l) => l.id === (word?.lesson || lesson || 1))
      ?.grammar[0]?.[2] || "我喜欢学习汉语。";
  const chars = sentence.replace(/[，。？！]/g, "").split("");
  const options = useMemo(
    () =>
      word
        ? shuffle([
            word,
            ...shuffle(
              course.vocab.filter(
                (w) =>
                  w.id !== word.id &&
                  w.hanzi !== word.hanzi &&
                  w.meaning !== word.meaning,
              ),
            )
              .filter(
                (w, i, a) =>
                  a.findIndex((v) =>
                    mode === "listen"
                      ? v.hanzi === w.hanzi
                      : v.meaning === w.meaning,
                  ) === i,
              )
              .slice(0, 3),
          ])
        : [],
    [word, mode, course],
  );
  const order = useMemo(
    () => shuffle(chars.map((_, i) => i)),
    [sentence, index],
  );
  function start(m: string) {
    const a =
      m === "review"
        ? pool.filter(
            (w) =>
              (progress.wrong[w.id] || 0) > 0 ||
              (progress.reviews[w.id] &&
                progress.reviews[w.id].due <= Date.now()),
          )
        : pool;
    setDeck(shuffle(a).slice(0, 10));
    setMode(m);
    setIndex(0);
    setScore(0);
    setDone(false);
    reset();
  }
  function reset() {
    setFlipped(false);
    setAnswer("");
    setAnswered(false);
    setError("");
    setPieces([]);
  }
  function check(good: boolean) {
    if (answered) return;
    setCorrect(good);
    setAnswered(true);
    setScore((s) => s + (good ? 1 : 0));
    setProgress((p) => review(p, word.id, good));
  }
  function next() {
    if (index === deck.length - 1) {
      setDone(true);
      setProgress((p) => ({
        ...p,
        history: [
          {
            date: new Date().toISOString(),
            type: mode,
            score,
            total: deck.length,
          },
          ...p.history,
        ].slice(0, 200),
      }));
    } else {
      setIndex((i) => i + 1);
      reset();
    }
  }
  if (!mode)
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">YOUR PRACTICE PLAYGROUND</span>
          <h1>Find your flow.</h1>
          <p>Mix up the way you learn. A ten-card round is all it takes.</p>
        </div>
        <label className="field-label" htmlFor="practice-lesson">
          Today’s lesson
        </label>
        <select
          id="practice-lesson"
          value={lesson}
          onChange={(e) => setLesson(+e.target.value)}
        >
          <option value={0}>All Chinese 2 lessons</option>
          {course.lessons.map((l) => (
            <option value={l.id} key={l.id}>
              Lesson {l.id} · {l.theme}
            </option>
          ))}
        </select>
        <div className="mode-grid">
          {modes.map(({ id, name, hint, icon: Icon }, i) => (
            <button
              className={"mode-card tint-" + i}
              key={id}
              onClick={() => start(id)}
            >
              <span className="mode-icon">
                <Icon />
              </span>
              <h2>{name}</h2>
              <p>{hint}</p>
              <span className="link-text">
                Let’s go <ArrowRight size={18} />
              </span>
            </button>
          ))}
        </div>
      </>
    );
  if (!deck.length)
    return (
      <section className="panel empty">
        <CheckCircle2 size={44} />
        <h1>Nothing due right now.</h1>
        <p>Try a fresh round or come back when it’s time to review.</p>
        <button className="btn" onClick={() => setMode("")}>
          Choose a practice
        </button>
      </section>
    );
  if (done)
    return (
      <section className="panel empty celebration">
        <span className="completion-star">✦</span>
        <span className="eyebrow">LOOK AT YOU GO</span>
        <h1>
          {score} / {deck.length}
        </h1>
        <p>Another small step forward. Your review list is updated.</p>
        <div className="row center">
          <button className="btn" onClick={() => start(mode)}>
            Another round <RefreshCw size={17} />
          </button>
          <button className="btn secondary" onClick={() => setMode("")}>
            Try something else
          </button>
        </div>
      </section>
    );
  const flash = ["flash", "review"].includes(mode);
  return (
    <>
      <div className="row between">
        <button className="text-button" onClick={() => setMode("")}>
          ← Practice playground
        </button>
        <span className="pill">
          {index + 1} / {deck.length}
        </span>
      </div>
      <div className="meter">
        <span style={{ width: `${(index / deck.length) * 100}%` }} />
      </div>
      <div className="practice-stage">
        <span className="eyebrow">
          LESSON {word.lesson} · {modes.find((m) => m.id === mode)?.name}
        </span>
        {flash ? (
          <button
            className={"flip-card " + (flipped ? "flipped" : "")}
            onClick={() => setFlipped(!flipped)}
            aria-label={flipped ? "Show Chinese word" : "Flip to meaning"}
            aria-pressed={flipped}
          >
            <span className="flip-inner">
              <span className="flip-front" aria-hidden={flipped}>
                {word.image && (
                  <img src={word.image} alt="Vocabulary illustration" />
                )}
                <strong lang="zh" className="hanzi">
                  {word.hanzi}
                </strong>
                <small>Tap to turn it over ↻</small>
              </span>
              <span className="flip-back" aria-hidden={!flipped}>
                <strong className="hanzi">{word.hanzi}</strong>
                <span className="pinyin">{word.pinyin}</span>
                <h2>{word.meaning}</h2>
                <small>
                  {word.note ||
                    "Say the word out loud, then try without looking."}
                </small>
              </span>
            </span>
          </button>
        ) : (
          <section className="panel question-panel">
            {mode === "listen" ? (
              <>
                <button
                  className="listen-orb"
                  aria-label="Play the practice word"
                  onClick={() => speak(word.audioText || word.hanzi, setError)}
                >
                  <Volume2 size={38} />
                </button>
                <h2>Which word did you hear?</h2>
                <small>Uses your device’s Chinese speech voice.</small>
              </>
            ) : mode === "sentence" ? (
              <>
                <h2>Build this sentence.</h2>
                <p>
                  {course.lessons.find((l) => l.id === (word.lesson || 1))
                    ?.grammar[0]?.[3] || "I like learning Chinese."}
                </p>
                <div className="sentence-answer" lang="zh">
                  {pieces.map((i) => chars[i]).join("") || "…"}
                </div>
                <div className="characters">
                  {order.map((i) => (
                    <button
                      key={i}
                      disabled={answered || pieces.includes(i)}
                      onClick={() => setPieces((p) => [...p, i])}
                    >
                      {chars[i]}
                    </button>
                  ))}
                </div>
                <button
                  className="text-button"
                  disabled={answered}
                  onClick={() => setPieces([])}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <small>
                  {mode === "pinyin"
                    ? "How do you write the pinyin?"
                    : "What does this word mean?"}
                </small>
                <h2 className="question-hanzi" lang="zh">
                  {word.hanzi}
                </h2>
                {mode === "meaning" && <p className="pinyin">{word.pinyin}</p>}
              </>
            )}
            {(mode === "meaning" || mode === "listen") && (
              <div className="choices">
                {options.map((w) => (
                  <button
                    key={w.id}
                    disabled={answered}
                    className={
                      answered
                        ? w.id === word.id
                          ? "correct"
                          : w.id === answer
                            ? "incorrect"
                            : ""
                        : ""
                    }
                    onClick={() => {
                      setAnswer(w.id);
                      check(w.id === word.id);
                    }}
                  >
                    {mode === "listen" ? (
                      <span className="hanzi">{w.hanzi}</span>
                    ) : (
                      w.meaning
                    )}
                    {answered && w.id === word.id && <Check size={18} />}
                  </button>
                ))}
              </div>
            )}
            {mode === "pinyin" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  check(
                    normalizePinyin(answer) === normalizePinyin(word.pinyin),
                  );
                }}
              >
                <label className="sr-only" htmlFor="pinyin-answer">
                  Your pinyin answer
                </label>
                <input
                  id="pinyin-answer"
                  autoComplete="off"
                  autoCapitalize="none"
                  value={answer}
                  disabled={answered}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type pinyin, with or without tones"
                />
                <small>
                  Tone marks are optional in this drill. Use ü, v, or u: for ü.
                </small>
                <button className="btn" disabled={answered || !answer.trim()}>
                  Check answer
                </button>
              </form>
            )}
            {mode === "sentence" && (
              <button
                className="btn"
                disabled={answered || pieces.length !== chars.length}
                onClick={() =>
                  check(pieces.map((i) => chars[i]).join("") === chars.join(""))
                }
              >
                Check sentence
              </button>
            )}
          </section>
        )}
        <div className="row center">
          <button
            className="btn secondary"
            onClick={() => speak(word.audioText || word.hanzi, setError)}
          >
            <Volume2 size={18} /> Listen
          </button>
          {flash && !answered && (
            <>
              <button className="btn secondary" onClick={() => check(false)}>
                Still learning
              </button>
              <button className="btn" onClick={() => check(true)}>
                Got it <Check size={17} />
              </button>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {answered && (
          <div
            className={"feedback " + (correct ? "good" : "try-again")}
            role="status"
          >
            <strong>
              {correct ? "Nicely done!" : "A little more practice."}
            </strong>
            <p>
              {mode === "sentence"
                ? sentence
                : `${word.hanzi} · ${word.pinyin} · ${word.meaning}`}
            </p>
            <button className="btn" onClick={next}>
              {index === deck.length - 1 ? "See my result" : "Next"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
