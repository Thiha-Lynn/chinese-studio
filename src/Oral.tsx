import { useState } from "react";
import { ArrowRight, Mic, Volume2, Play, Eye } from "lucide-react";
import type { Course, Progress } from "./types";
import { award, shuffle, speak } from "./lib";
import Recorder from "./Recorder";
export default function Oral({
  course,
  progress,
  setProgress,
}: {
  course: Course;
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
}) {
  const [tab, setTab] = useState("prepare"),
    [items, setItems] = useState<any[]>([]),
    [index, setIndex] = useState(0),
    [shown, setShown] = useState(false),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false);
  const groups = course.exam.groups as any[];
  function start() {
    setItems([
      ...shuffle(course.exam.vocab as any[])
        .slice(0, 5)
        .map((w) => ({
          q: w.hanzi,
          qp: w.pinyin,
          meaning: w.english,
          a: w.hanzi,
          ap: w.pinyin,
          translation: w.english,
          points: 1,
        })),
      ...shuffle(groups)
        .slice(0, 5)
        .map((g) => ({
          ...shuffle(g.items as any[])[0],
          group: g.title,
          points: 2,
        })),
    ]);
    setTab("test");
    setIndex(0);
    setShown(false);
    setScore(0);
    setDone(false);
  }
  function rate(n: number) {
    const total = score + n;
    setScore(total);
    if (index === 9) {
      setDone(true);
      setProgress((p) =>
        award(
          {
            ...p,
            history: [
              {
                date: new Date().toISOString(),
                type: "Oral test 1 · self-rated",
                score: total,
                total: 15,
              },
              ...p.history,
            ].slice(0, 200),
          },
          15,
        ),
      );
    } else {
      setIndex((i) => i + 1);
      setShown(false);
    }
  }
  const item = items[index];
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">CHINESE 2 · LESSONS 1–5</span>
        <h1>
          A little rehearsal.
          <br />A lot more confidence.
        </h1>
        <p>Oral Test 1: 5 reading items + 5 questions · 15 points.</p>
      </div>
      <div className="tabs">
        {[
          ["prepare", "Prepare my answers"],
          ["reading", "Read the words"],
          ["test", "Mock oral test"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "prepare" && (
        <div className="oral-groups">
          {groups.map((g) => (
            <details className="panel" key={g.number}>
              <summary>
                <span className="round-num">{g.number}</span>
                <h2>{g.title}</h2>
                <span className="pill">Lesson {g.lesson}</span>
              </summary>
              <p className="muted">{g.note}</p>
              {g.items.map((q: any, i: number) => {
                const key = `oral-${g.number}-${i}`;
                return (
                  <div className="oral-question" key={key}>
                    <div className="row between">
                      <h3 className="hanzi" lang="zh">
                        {q.q}
                      </h3>
                      <button
                        className="icon-button"
                        onClick={() => speak(q.q)}
                        aria-label={"Listen: " + q.q}
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                    <p className="pinyin">{q.qp}</p>
                    <p>{q.meaning}</p>
                    <div className="soft-note">
                      <strong>One possible answer</strong>
                      <p className="hanzi" lang="zh">
                        {q.a}
                      </p>
                      <p>{q.ap}</p>
                      <small>{q.translation}</small>
                    </div>
                    <label className="field-label" htmlFor={key}>
                      Make it true for you
                    </label>
                    <textarea
                      id={key}
                      value={progress.answers[key] || ""}
                      maxLength={2000}
                      placeholder="Write your own answer here…"
                      onChange={(e) =>
                        setProgress((p) => ({
                          ...p,
                          answers: { ...p.answers, [key]: e.target.value },
                        }))
                      }
                    />
                  </div>
                );
              })}
            </details>
          ))}
        </div>
      )}
      {tab === "reading" && (
        <>
          <p className="muted">
            These 30 reading items come from the teacher’s Oral Test 1
            preparation sheet.
          </p>
          <div className="reading-grid">
            {course.exam.vocab.map((w: any) => (
              <details className="panel" key={w.hanzi}>
                <summary>
                  <strong className="hanzi">{w.hanzi}</strong>
                  <Eye size={16} />
                </summary>
                <p className="pinyin">{w.pinyin}</p>
                <p>{w.english}</p>
                <button
                  className="icon-button"
                  onClick={() => speak(w.hanzi)}
                  aria-label={"Listen: " + w.hanzi}
                >
                  <Volume2 size={18} />
                </button>
              </details>
            ))}
          </div>
        </>
      )}
      {tab === "test" &&
        (done ? (
          <section className="panel empty celebration">
            <span className="completion-star">✦</span>
            <h2>Your rehearsal: {score} / 15</h2>
            <p>
              This is your self-rating, not an official pronunciation or exam
              grade.
            </p>
            <button className="btn" onClick={start}>
              Try a fresh rehearsal <ArrowRight size={17} />
            </button>
          </section>
        ) : !items.length ? (
          <section className="panel exam-start">
            <Mic size={40} />
            <h2>Meet your next confident moment.</h2>
            <p>
              Read five words, then answer five questions. Speak first, reveal
              the example, and rate how comfortably you answered.
            </p>
            <button className="btn" onClick={start}>
              <Play size={17} /> Start rehearsal
            </button>
            <small>
              Example answers are study aids. Use your real details.
            </small>
          </section>
        ) : (
          <section className="panel exam-question">
            <div className="row between">
              <span className="pill">
                {index < 5 ? "READING" : "ANSWER A QUESTION"} · {item.points}{" "}
                {item.points === 1 ? "point" : "points"}
              </span>
              <strong>{index + 1} / 10</strong>
            </div>
            <h2 lang="zh" className="question-hanzi">
              {item.q}
            </h2>
            <div className="row center">
              <button className="btn secondary" onClick={() => speak(item.q)}>
                <Volume2 size={17} /> Hear question
              </button>
              <button
                className="btn secondary"
                onClick={() => setShown(!shown)}
              >
                <Eye size={17} /> {shown ? "Hide help" : "Reveal help"}
              </button>
            </div>
            <Recorder key={index} />
            {shown && (
              <div className="soft-note">
                <p>{item.qp}</p>
                <p>{item.meaning}</p>
                <strong className="hanzi">{item.a}</strong>
                <p>{item.ap}</p>
                <small>{item.translation}</small>
              </div>
            )}
            <hr />
            <p>How did that feel? Rate yourself after speaking.</p>
            <div className="row center">
              <button className="btn secondary" onClick={() => rate(0)}>
                Need another try · 0
              </button>
              {item.points === 2 && (
                <button className="btn secondary" onClick={() => rate(1)}>
                  With help · 1
                </button>
              )}
              <button className="btn" onClick={() => rate(item.points)}>
                Comfortable · {item.points}
              </button>
            </div>
          </section>
        ))}
    </>
  );
}
