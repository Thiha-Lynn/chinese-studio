import {
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import type { Progress, Course } from "./types";
import type {
  Chinese1Data,
  Lang,
  SourceNode,
  SourceTemplate,
  SourceItem,
  SourceQuestion,
} from "./chinese1-data";
import {
  textFor,
  nodeTitle,
  choicesFor,
  selectionCorrect,
  normalizedAnswer,
} from "./chinese1-data";
import Practice from "./Practice";
import { review } from "./lib";
import "./chinese1.css";
const Glyphs = lazy(() => import("./Glyphs"));
type SetProgress = (f: (p: Progress) => Progress) => void;
type Context = { data: Chinese1Data; lang: string; go: (code: string) => void };
function Multilingual({
  value,
  lang,
  heading = false,
}: {
  value?: Lang;
  lang: string;
  heading?: boolean;
}) {
  const main = textFor(value, lang);
  if (!main || /\.(mp3|mp4|wav|webm)$/i.test(main)) return null;
  const chinese = value?.CN,
    py = value?.["PIN IN"];
  return (
    <div className="c1-language">
      {heading ? <h3>{main}</h3> : <p>{main}</p>}
      {chinese && chinese !== main && (
        <p lang="zh" className="c1-hanzi">
          {chinese}
        </p>
      )}
      {py && py !== main && py !== chinese && <p className="c1-pinyin">{py}</p>}
    </div>
  );
}
function Media({
  source,
  ctx,
  label = "Original course media",
}: {
  source?: string;
  ctx: Context;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!source) return null;
  const url = ctx.data.media[source];
  if (!url || failed)
    return (
      <span className="c1-missing" role="note">
        {label}: source file unavailable in this archive.
      </span>
    );
  if (/\.(mp3|wav)$/i.test(url))
    return (
      <audio
        controls
        preload="none"
        src={url}
        aria-label={label}
        onError={() => setFailed(true)}
      />
    );
  if (/\.(mp4|webm)$/i.test(url))
    return (
      <div className="c1-video">
        <video
          controls
          playsInline
          preload="none"
          src={url}
          aria-label={label}
          onError={() => setFailed(true)}
        />
        <a href={url} download>
          Download video
        </a>
      </div>
    );
  return (
    <img loading="lazy" src={url} alt={label} onError={() => setFailed(true)} />
  );
}
function Item({
  value,
  ctx,
  label,
}: {
  value: SourceItem;
  ctx: Context;
  label?: string;
}) {
  const item = value.item || value;
  if (!item.data || item.comment === "Max Score") return null;
  return /\.(mp3|wav|mp4|webm|png|jpg|jpeg|gif)(?:\?|$)/i.test(item.data) ? (
    <Media key={item.data} source={item.data} ctx={ctx} label={label} />
  ) : (
    <p className="c1-source-text">{item.data}</p>
  );
}
function Jump({
  code,
  ctx,
  children,
}: {
  code?: string;
  ctx: Context;
  children: ReactNode;
}) {
  if (!code) return null;
  return (
    <button className="btn secondary c1-jump" onClick={() => ctx.go(code)}>
      {children}
    </button>
  );
}
function Question({
  q,
  node,
  ctx,
  index,
  progress,
  setProgress,
}: {
  q: SourceQuestion;
  node: SourceNode;
  ctx: Context;
  index: number;
  progress: Progress;
  setProgress: SetProgress;
}) {
  const choices = choicesFor(q),
    ordered = node.code.startsWith("IAM08-"),
    soundboard = node.code.startsWith("IAM01-"),
    collection = node.code.startsWith("LKA01-");
  const [selected, setSelected] = useState<number[]>([]),
    [checked, setChecked] = useState(false),
    [typed, setTyped] = useState("");
  const expected =
    node.answers?.correctAnswers?.find((a) => a.score > 0)?.answer ||
    (ordered ? q.item.find((i) => (i.score || 0) > 0)?.item?.data || "" : "");
  const entered = ordered
    ? selected
        .map((i) => choices[i]?.item?.data || choices[i]?.data || "")
        .join("")
    : typed;
  const correct = ordered
    ? expected
      ? normalizedAnswer(entered) === normalizedAnswer(expected)
      : null
    : selectionCorrect(q, selected);
  const key = `c1:${node.code}:q${index}`;
  function check() {
    setChecked(true);
    setProgress((p) => ({
      ...p,
      answers: {
        ...p.answers,
        [key]: JSON.stringify({ selected, entered, correct }),
      },
    }));
  }
  if (collection)
    return (
      <section className="panel c1-question">
        <Multilingual value={q.title} lang={ctx.lang} />
        <Multilingual value={q.desciption} lang={ctx.lang} />
        {q.item.map((i, n) => (
          <Item key={n} value={i} ctx={ctx} />
        ))}
      </section>
    );
  if (soundboard)
    return (
      <section className="panel c1-question">
        <p>
          Listen and practise combining sounds. This is an ungraded sound
          practice activity.
        </p>
        <div className="c1-tokens">
          {q.item.map((item, i) => (
            <Item key={i} value={item} ctx={ctx} />
          ))}
        </div>
        <div className="c1-sounds">
          {choices.map((c, i) => (
            <div className="panel" key={i}>
              <Item value={c} ctx={ctx} label={`Pronunciation ${i + 1}`} />
              <details>
                <summary>Show pronunciation</summary>
                {textFor(c.title, ctx.lang) ||
                  c.item?.comment ||
                  "No transcription supplied."}
              </details>
            </div>
          ))}
        </div>
      </section>
    );
  return (
    <section className="panel c1-question">
      <Multilingual value={q.title} lang={ctx.lang} />
      <Multilingual value={q.desciption} lang={ctx.lang} />
      {!ordered &&
        q.item.map((i, n) => (
          <Item key={n} value={i} ctx={ctx} label="Question audio" />
        ))}
      {ordered && (
        <>
          <p>
            Select the tiles in sentence order. Select a chosen tile again to
            remove it.
          </p>
          <div className="c1-sentence" aria-label="Your sentence">
            {selected.length
              ? selected.map((i, n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setSelected((s) => s.filter((_, j) => j !== n));
                      setChecked(false);
                    }}
                  >
                    {choices[i].item?.data}
                  </button>
                ))
              : "Your sentence will appear here."}
          </div>
        </>
      )}
      <div className="c1-options">
        {choices.map((c, i) => (
          <label
            key={i}
            className={
              selected.includes(i) ? "c1-option selected" : "c1-option"
            }
          >
            <input
              type={ordered || q.multiSelect ? "checkbox" : "radio"}
              name={key}
              checked={selected.includes(i)}
              onChange={() => {
                setChecked(false);
                setSelected((s) =>
                  ordered || q.multiSelect
                    ? s.includes(i)
                      ? s.filter((j) => j !== i)
                      : [...s, i]
                    : [i],
                );
              }}
            />
            <span className="c1-option-letter">
              {String.fromCharCode(65 + i)}
            </span>
            <Item
              value={c}
              ctx={ctx}
              label={`Choice ${String.fromCharCode(65 + i)} audio`}
            />
          </label>
        ))}
      </div>
      {!choices.length && (
        <label>
          Your response
          <input
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setChecked(false);
            }}
          />
        </label>
      )}
      <div className="c1-actions">
        <button
          className="btn"
          disabled={!selected.length && !typed}
          onClick={check}
        >
          Check answer
        </button>
        <button
          className="text-button"
          onClick={() => {
            setSelected([]);
            setTyped("");
            setChecked(false);
          }}
        >
          Try again
        </button>
      </div>
      {checked && (
        <div role="status" className="soft-note">
          {correct === null
            ? "Saved for self-review. The source does not provide a usable scoring key for this activity."
            : correct
              ? "Correct according to the archived source key."
              : "Not yet. Review the choices and try again."}
          {ordered && expected && (
            <details>
              <summary>Show source answer</summary>
              <p lang="zh">{expected}</p>
            </details>
          )}
        </div>
      )}
      {!checked && progress.answers[key] && (
        <small>A previous attempt is saved in your progress backup.</small>
      )}
    </section>
  );
}
function Template({
  t,
  node,
  ctx,
  progress,
  setProgress,
}: {
  t: SourceTemplate;
  node: SourceNode;
  ctx: Context;
  progress: Progress;
  setProgress: SetProgress;
}) {
  const c = t.content || {};
  let body: ReactNode = null;
  if (t.type === 1)
    body = (
      <>
        <Multilingual value={c.title} lang={ctx.lang} heading />
        <Multilingual value={c.subTitle} lang={ctx.lang} />
        <div className="c1-card-media">
          {(c.item || [])
            .filter(
              (i: SourceItem) =>
                i.type !== 0 || !Object.values(c.title || {}).includes(i.data),
            )
            .map((i: SourceItem, n: number) => (
              <Item key={n} value={i} ctx={ctx} />
            ))}
        </div>
        <Multilingual value={c.description} lang={ctx.lang} />
        <Multilingual value={c.note} lang={ctx.lang} />
      </>
    );
  else if (t.type === 2)
    body = (c.question || []).map((q: SourceQuestion, i: number) => (
      <Question
        key={node.code + ":" + i}
        q={q}
        node={node}
        ctx={ctx}
        index={i}
        progress={progress}
        setProgress={setProgress}
      />
    ));
  else if (t.type === 3 || t.type === 4)
    body = (
      <div className="c1-dialogue">
        {(t.type === 3 ? c.item || [] : c.image || []).map(
          (item: any, i: number) => (
            <section
              key={i}
              className={`c1-dialogue-row ${/\.(mp4|webm)$/i.test(item.image || item.url || "") ? "c1-video-row" : ""} ${item.position === "right" ? "right" : ""}`}
            >
              <Media
                source={item.image || item.url}
                ctx={ctx}
                label="Original story character"
              />
              <div>
                <Multilingual value={item.message} lang={ctx.lang} />
                {[...new Set(Object.values(item.message || {}))]
                  .filter((v: any) => /\.(mp4|mp3)$/i.test(v))
                  .map((v: any) => (
                    <Media key={v} source={v} ctx={ctx} />
                  ))}
                <Jump code={item.button?.action} ctx={ctx}>
                  {textFor(item.button?.text, ctx.lang) || "Continue"}
                </Jump>
              </div>
            </section>
          ),
        )}
      </div>
    );
  else if (t.type === 5)
    body = (
      <div className="c1-grid">
        {(c.item || []).map((item: any, i: number) => (
          <section className="panel c1-menu-card" key={i}>
            <Media
              source={item.icon?.enable?.data}
              ctx={ctx}
              label={textFor(item.title, ctx.lang) || "Chapter illustration"}
            />
            <Jump code={item.navigate?.action} ctx={ctx}>
              {textFor(item.title, ctx.lang) ||
                textFor(item.navigate?.title, ctx.lang) ||
                "Open activity"}
            </Jump>
          </section>
        ))}
      </div>
    );
  else if (t.type === 6)
    body = (c.nav || []).map((group: any, i: number) => (
      <section key={i} className="panel">
        <h3>{textFor(group.header?.text, ctx.lang)}</h3>
        <div className="c1-chapter-list">
          {(group.item || []).map((item: any, j: number) => (
            <Jump key={j} code={item.button?.action} ctx={ctx}>
              {textFor(item.title, ctx.lang) || "Open chapter"}
            </Jump>
          ))}
          {(group.header?.button || []).map((button: any, j: number) => (
            <Jump key={j} code={button.action} ctx={ctx}>
              {textFor(button.text, ctx.lang) || "Start"}
            </Jump>
          ))}
        </div>
      </section>
    ));
  else if (t.type === 8)
    body = (c.page || []).map((page: any, i: number) => (
      <section className="panel" key={i}>
        <Multilingual value={page.title} lang={ctx.lang} heading />
        <Media source={page.image?.url} ctx={ctx} />
        {(page.paragraph || []).map((paragraph: any, j: number) => (
          <div key={j}>
            {(paragraph.line || []).map((line: any, k: number) => (
              <div key={k}>
                <Multilingual value={line.text} lang={ctx.lang} />
                {line.class?.startsWith("/") && (
                  <Media source={line.class} ctx={ctx} label="Example audio" />
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    ));
  return (
    <>
      <Multilingual value={t.description} lang={ctx.lang} />
      {body}
      <div className="c1-actions">
        {(["previous", "next"] as const).map((direction) => (
          <Jump
            key={direction}
            code={t.navigate?.[direction]?.action}
            ctx={ctx}
          >
            {direction === "previous" ? "← Previous" : "Next →"}
          </Jump>
        ))}
      </div>
    </>
  );
}
export default function Chinese1({
  progress,
  setProgress,
}: {
  progress: Progress;
  setProgress: SetProgress;
}) {
  const [data, setData] = useState<Chinese1Data | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [lang, setLang] = useState("EN"),
    [section, setSection] = useState("lessons"),
    [code, setCode] = useState(
      () => new URLSearchParams(location.search).get("page") || "",
    ),
    [query, setQuery] = useState(""),
    [lessonFilter, setLessonFilter] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    fetch("/chinese1.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (live) setData(d);
      })
      .catch(() => {
        if (live)
          setError(
            "Chinese 1 could not be loaded. Check your connection or save the lesson pack for offline use.",
          );
      });
    return () => {
      live = false;
    };
  }, [retry]);
  useEffect(() => {
    const restore = () => {
      setCode(new URLSearchParams(location.search).get("page") || "");
      setSection("lessons");
      setQuery("");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const course = useMemo<Course | null>(
    () =>
      data
        ? {
            lessons: data.lessons.map((l) => ({
              id: l.id,
              title: textFor(l.title).replace(/^Lesson \d+-/, ""),
              hanzi: l.title.CN || "",
              theme: "Chinese 1",
              art: data.media[l.art] || "",
              grammar: [],
              slides: [],
              resources: [],
              summaries: [],
            })),
            vocab: data.vocab,
            exam: {},
            coverage: [],
          }
        : null,
    [data],
  );
  if (error)
    return (
      <section className="panel">
        <p role="alert">{error}</p>
        <button className="btn" onClick={() => setRetry((x) => x + 1)}>
          Retry
        </button>
      </section>
    );
  if (!data || !course) return <p role="status">Loading Chinese 1…</p>;
  const go = (next: string) => {
    setCode(next);
    setQuery("");
    setSection("lessons");
    history.pushState(
      {},
      "",
      location.pathname + "?page=" + encodeURIComponent(next),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const ctx = { data, lang, go },
    node = data.nodes[code];
  const results = query
    ? Object.values(data.nodes)
        .filter(
          (n) =>
            (!lessonFilter || n.lesson === lessonFilter) &&
            n.templates.length &&
            JSON.stringify(
              n.templates.map((t) => ({
                title: t.title,
                description: t.description,
                content: t.content,
              })),
            )
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .slice(0, 100)
    : [];
  const words = data.vocab.filter(
    (w) =>
      (!lessonFilter || w.lesson === lessonFilter) &&
      (!query ||
        [w.hanzi, w.pinyin, w.meaning].some((s) =>
          s.toLowerCase().includes(query.toLowerCase()),
        )),
  );
  return (
    <div className="c1-root">
      <div className="page-heading">
        <span className="eyebrow">CHINESE 1 · MFU SOURCE LIBRARY</span>
        <h1>Start with the foundations.</h1>
        <p>Ten lessons, original voices and a story to follow.</p>
        <p className="muted">
          {data.stats.pages} source pages · {data.stats.vocabulary} vocabulary
          cards · {data.stats.questions} activity questions
        </p>
      </div>
      <div className="c1-toolbar">
        <div className="c1-tabs" aria-label="Chinese 1 sections">
          {[
            ["lessons", "Lessons"],
            ["vocabulary", "Vocabulary"],
            ["practice", "Practice"],
            ["handwriting", "Handwriting"],
            ["resources", "Resources"],
            ["coverage", "Coverage"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={section === id}
              onClick={() => {
                setSection(id);
                setQuery("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          Source language
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="EN">English</option>
            <option value="TH">ไทย</option>
            <option value="CN">中文</option>
            <option value="PIN IN">Pinyin</option>
          </select>
        </label>
      </div>
      {(section === "lessons" || section === "vocabulary") && (
        <div className="c1-filters">
          <label>
            Search Chinese 1
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Characters, pinyin or a topic"
            />
          </label>
          <label>
            Lesson
            <select
              value={lessonFilter}
              onChange={(e) => setLessonFilter(Number(e.target.value))}
            >
              <option value={0}>All lessons</option>
              {data.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {textFor(l.title, lang)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {section === "lessons" &&
        (query ? (
          <>
            <p>
              {results.length === 100 ? "First 100" : results.length} matching
              pages
            </p>
            <div className="c1-chapter-list">
              {results.map((n) => (
                <Jump key={n.code} code={n.code} ctx={ctx}>
                  Lesson {n.lesson || "intro"} · {nodeTitle(n, lang)}{" "}
                  <small>{n.code}</small>
                </Jump>
              ))}
            </div>
          </>
        ) : code ? (
          <>
            <div className="c1-actions">
              <button
                className="text-button"
                onClick={() => {
                  setCode("");
                  history.pushState({}, "", location.pathname);
                }}
              >
                ← All Chinese 1 lessons
              </button>
              {node?.lesson && (
                <Jump code={"HP02-" + node.lesson} ctx={ctx}>
                  Lesson {node.lesson} contents
                </Jump>
              )}
              {node?.parent && (
                <Jump code={node.parent} ctx={ctx}>
                  Up one level
                </Jump>
              )}
            </div>
            {node ? (
              <article className="c1-reader">
                <span className="eyebrow">
                  {node.lesson ? `LESSON ${node.lesson}` : "COURSE MATERIAL"}
                </span>
                <h2>{nodeTitle(node, lang)}</h2>
                {node.templates.map((t, i) => (
                  <Template
                    key={code + ":" + i}
                    t={t}
                    node={node}
                    ctx={ctx}
                    progress={progress}
                    setProgress={setProgress}
                  />
                ))}
                {!node.templates.length && (
                  <div className="c1-chapter-list">
                    {node.children.length ? (
                      node.children.map((child) => (
                        <Jump key={child} code={child} ctx={ctx}>
                          {data.nodes[child]
                            ? nodeTitle(data.nodes[child], lang)
                            : "Unavailable source activity"}{" "}
                          <small>{child}</small>
                        </Jump>
                      ))
                    ) : (
                      <p>
                        This source collection has no published pages in the
                        captured data.
                      </p>
                    )}
                  </div>
                )}
                <div className="soft-note">
                  <label>
                    <input
                      type="checkbox"
                      checked={progress.answers["c1:read:" + code] === "done"}
                      onChange={(e) => {
                        const done = e.target.checked;
                        setProgress((p) => ({
                          ...p,
                          answers: {
                            ...p.answers,
                            ["c1:read:" + code]: done ? "done" : "",
                          },
                        }));
                      }}
                    />{" "}
                    Mark this page studied
                  </label>
                  <small>
                    Saved in your existing progress backup. Independent study;
                    no grades are sent to MFU.
                  </small>
                </div>
              </article>
            ) : (
              <section className="panel">
                <h2>Source page unavailable</h2>
                <p>
                  The source references {code}, but MDL returned no retrievable
                  content. This gap is recorded in Coverage.
                </p>
              </section>
            )}
          </>
        ) : (
          <div className="c1-grid">
            {data.lessons
              .filter((l) => !lessonFilter || l.id === lessonFilter)
              .map((l) => (
                <section className="panel c1-lesson" key={l.id}>
                  <Media
                    source={l.art}
                    ctx={ctx}
                    label={`Lesson ${l.id} island`}
                  />
                  <span className="eyebrow">LESSON {l.id}</span>
                  <h2>{textFor(l.title, lang).replace(/^Lesson \d+-/, "")}</h2>
                  <p lang="zh">{l.title.CN}</p>
                  <p>
                    {l.chapters} chapters · {l.pages} source pages
                  </p>
                  <Jump code={l.code} ctx={ctx}>
                    Explore lesson →
                  </Jump>
                </section>
              ))}
          </div>
        ))}
      {section === "lessons" && !code && !query && (
        <section className="panel">
          <h2>Course collections</h2>
          <div className="c1-chapter-list">
            {Object.values(data.nodes)
              .filter(
                (n) =>
                  n.lesson === 0 && n.children.length && n.code !== "HP01-1",
              )
              .map((n) => (
                <Jump key={n.code} code={n.code} ctx={ctx}>
                  {nodeTitle(n, lang)} · {n.code}
                </Jump>
              ))}
          </div>
        </section>
      )}
      {section === "vocabulary" && (
        <>
          <p>{words.length} cards · original source wording and pinyin</p>
          <div className="c1-grid">
            {words.map((w) => (
              <section className="panel c1-word" key={w.id}>
                {w.image && (
                  <img src={w.image} alt={w.meaning} loading="lazy" />
                )}
                <h2 lang="zh">{w.hanzi}</h2>
                <p className="c1-pinyin">{w.pinyin}</p>
                <p>{w.meaning}</p>
                {w.audio && (
                  <audio
                    controls
                    preload="none"
                    src={w.audio}
                    aria-label={`Original pronunciation of ${w.hanzi}`}
                  />
                )}
                <div className="c1-actions">
                  <Jump code={w.code} ctx={ctx}>
                    Source lesson
                  </Jump>
                  <button
                    className="text-button"
                    onClick={() =>
                      setProgress((p) => review(p, w.id, !p.known[w.id]))
                    }
                  >
                    {progress.known[w.id] ? "Learned ✓" : "Mark learned"}
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {section === "practice" && (
        <>
          <p className="soft-note">
            Independent drills use the Chinese 1 vocabulary. Original MDL
            activities are also available inside each lesson. Listening drills
            use device speech; vocabulary cards play the archived original
            recordings.
          </p>
          <Practice
            courseName="Chinese 1"
            includeSentences={false}
            course={course}
            progress={progress}
            setProgress={setProgress}
          />
        </>
      )}
      {section === "handwriting" && (
        <Suspense fallback={<p>Loading writing practice…</p>}>
          <Glyphs
            words={data.vocab}
            progress={progress}
            setProgress={setProgress}
          />
        </Suspense>
      )}
      {section === "resources" && (
        <>
          <h2>Classroom originals</h2>
          <p>
            Archived Section 6 materials, captured {data.capturedAt}. Historical
            deadlines remain in the original files.
          </p>
          <div className="c1-resource-list">
            {data.classroom.resources
              .filter((r) => r.url)
              .map((r) => (
                <a key={r.id} className="panel" href={r.url} download>
                  <strong>{r.category}</strong>
                  <span>{r.name}</span>
                  <span>Download original ↓</span>
                </a>
              ))}
          </div>
          <h2>MDL media library</h2>
          <p>
            Original media used throughout the lessons. Large videos can be
            downloaded individually.
          </p>
          <details>
            <summary>
              Browse all {Object.keys(data.media).length} saved media files
            </summary>
            <div className="c1-resource-list">
              {Object.entries(data.media).map(([source, url]) => (
                <a href={url} download key={source}>
                  {decodeURIComponent(source.split("/").pop() || source)}
                </a>
              ))}
            </div>
          </details>
          <p>
            <a href="/library/chinese1/source-records.zip" download>
              Download archived source records and manifests
            </a>
          </p>
          <a href={data.classroom.source} target="_blank" rel="noreferrer">
            Open archived Classroom ↗
          </a>
        </>
      )}
      {section === "coverage" && (
        <>
          <section className="panel">
            <h2>What is included</h2>
            <p>
              {data.stats.nodes} linked content records, {data.stats.pages}{" "}
              rendered source pages, {data.stats.mediaDownloaded} of{" "}
              {data.stats.mediaReferenced} referenced media files and{" "}
              {data.stats.classroomDownloaded} of{" "}
              {data.stats.classroomReferenced} classroom attachment originals.
            </p>
            <p>
              English, Chinese, pinyin and Thai are preserved as supplied by
              MFU. Source errors or translation differences may remain. This is
              an accessible study adaptation: it does not reproduce MDL’s game
              scoring, unlock rules, grade submissions or account services.
            </p>
            <p>
              Progress and practice attempts stay in your existing device
              backup, under Chinese 1 identifiers.
            </p>
          </section>
          <section className="panel">
            <h2>Source gaps</h2>
            {data.gaps.map((g) => (
              <p key={g.code}>
                {g.code}: {g.error}
              </p>
            ))}
            <p>
              {data.stats.mediaFailed} referenced media files were not
              downloaded. Unavailable media are labeled on their source pages.
            </p>
            <details>
              <summary>
                Classroom attachments awaiting originals (
                {data.classroom.resources.filter((r) => !r.url).length})
              </summary>
              {data.classroom.resources
                .filter((r) => !r.url)
                .map((r) => (
                  <p key={r.id}>
                    <a href={r.source} target="_blank" rel="noreferrer">
                      {r.name}
                    </a>{" "}
                    · {r.status}
                    <br />
                    <small>{r.detail}</small>
                  </p>
                ))}
            </details>
            <p>
              <a href="/library/chinese1/media-manifest.json" download>
                Media download manifest
              </a>{" "}
              ·{" "}
              <a href="/library/chinese1/classroom-manifest.json" download>
                Classroom attachment manifest
              </a>
            </p>
          </section>
          <section className="panel">
            <h2>Credits</h2>
            <p>
              Original course text, recordings, videos and artwork: Mae Fah
              Luang University / MFU Learning Innovation Institute. Classroom
              materials retain their original authorship. These resources retain
              their own rights and are not relicensed as MIT application code.
            </p>
            <a href={data.source} target="_blank" rel="noreferrer">
              Open official MDL Chinese 1 ↗
            </a>
          </section>
        </>
      )}
    </div>
  );
}
