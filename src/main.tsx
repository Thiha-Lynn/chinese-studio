import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BookOpen,
  Layers,
  Mic,
  PenLine,
  FolderOpen,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  Volume2,
  Check,
  Search,
  ChevronRight,
  ChevronLeft,
  Download,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Globe,
  Mountain,
  Flame,
  Play,
  RefreshCw,
} from "lucide-react";
import type { Course, Lesson, Word, Progress, User } from "./types";
import { freshProgress } from "./types";
import { api, award, review, speak } from "./lib";
import Tutor from "./Tutor";
import Practice from "./Practice";
import Oral from "./Oral";
import "./style.css";
import Offline from "./Offline";
import {
  bundledApp,
  mobileApp,
  openMobileResource,
  saveFile,
  installMobileDownloads,
} from "./native";
installMobileDownloads();
import { parseProgress } from "./progress";
const Glyphs = lazy(() => import("./Glyphs"));
function navigate(url: string) {
  history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}
function Link({
  to,
  children,
  className = "",
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <a
      href={to}
      className={className}
      {...rest}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
const nav = [
  ["/learn", "My worlds", BookOpen],
  ["/vocabulary", "Vocabulary", Layers],
  ["/practice", "Practice", Play],
  ["/oral", "Oral test", Mic],
  ["/handwriting", "Handwriting", PenLine],
  ["/resources", "Resources", FolderOpen],
  ["/progress", "My progress", BarChart3],
] as const;
function App() {
  const [url, setUrl] = useState(location.pathname),
    [course, setCourse] = useState<Course | null>(null),
    [progress, setProgress] = useState<Progress>(freshProgress),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [session, setSession] = useState<any>(null),
    [saveState, setSaveState] = useState("Saved on device"),
    [menu, setMenu] = useState(false),
    [viewer, setViewer] = useState(""),
    [online, setOnline] = useState(navigator.onLine),
    [theme, setTheme] = useState(() => {
      try {
        return localStorage.getItem("studio-theme") || "light";
      } catch {
        return "light";
      }
    }),
    [immersive, setImmersive] = useState(() => {
      try {
        return localStorage.getItem("studio-depth") !== "flat";
      } catch {
        return false;
      }
    });
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const f = () => {
        setUrl(location.pathname);
        setMenu(false);
        window.scrollTo(0, 0);
      },
      n = () => setOnline(navigator.onLine);
    window.addEventListener("popstate", f);
    window.addEventListener("online", n);
    window.addEventListener("offline", n);
    return () => {
      window.removeEventListener("popstate", f);
      window.removeEventListener("online", n);
      window.removeEventListener("offline", n);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.depth = immersive ? "immersive" : "flat";
    try {
      localStorage.setItem("studio-theme", theme);
      localStorage.setItem("studio-depth", immersive ? "immersive" : "flat");
    } catch {}
  }, [theme, immersive]);
  useEffect(() => {
    fetch("/course.json")
      .then((r) => {
        if (!r.ok) throw Error("Connect once to download your lessons.");
        return r.json();
      })
      .then((d) => {
        setCourse(d);
        try {
          const s = localStorage.getItem("studio-device-progress");
          if (s) setProgress(parseProgress(JSON.parse(s)));
        } catch {
          setError(
            "Your saved progress could not be read. Restore a valid backup in My progress.",
          );
        }
        setReady(true);
      })
      .catch((e) => setError(e.message));
    api("/api/session")
      .then(setSession)
      .catch(() =>
        setSession({ user: null, authReady: false, aiReady: false }),
      );
    if (!bundledApp && "serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          setError("Offline setup failed. Online lessons still work."),
        );
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("studio-device-progress", JSON.stringify(progress));
      setSaveState("Saved on device");
    } catch {
      setSaveState("Storage full · export progress");
    }
  }, [progress, ready]);
  useEffect(() => {
    if (viewer) dialog.current?.showModal();
    else dialog.current?.close();
  }, [viewer]);
  const match = url.match(/^\/lesson\/(\d+)$/),
    lesson = course?.lessons.find((l) => l.id === Number(match?.[1]));
  useEffect(() => {
    document.title =
      (lesson
        ? `Lesson ${lesson.id} · ${lesson.title}`
        : nav.find((n) => n[0] === url)?.[1] || "Chinese Studio") +
      " · Learn Chinese";
  }, [url, lesson]);
  const openResource = (s: string) => {
    if (!s.startsWith("/library/")) return;
    if (mobileApp && /\.(pdf|pptx|docx)$/i.test(s)) {
      void openMobileResource(s).catch(() =>
        setError(
          "Could not open this document. Install a PDF or Office reader on your device.",
        ),
      );
    } else if (/\.(pdf|png|webp)$/i.test(s)) setViewer(s);
    else window.open(s, "_blank", "noopener");
  };
  if (!course)
    return (
      <main className="loading-screen">
        <span className="brand-mark">中</span>
        <h1>{error || "Opening your learning world…"}</h1>
        {error && (
          <button className="btn" onClick={() => location.reload()}>
            Try again
          </button>
        )}
      </main>
    );
  const allowed = [
    "/",
    "/learn",
    "/vocabulary",
    "/practice",
    "/oral",
    "/handwriting",
    "/resources",
    "/progress",
    "/offline",
    "/coverage",
    "/course/1",
    "/privacy",
    "/terms",
  ];
  return (
    <div className="app-shell">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Link to="/learn" className="brand">
          <span className="brand-mark">中</span>
          <span>
            Chinese<span className="brand-light">Studio</span>
            <small>A LITTLE PRACTICE. EVERY DAY.</small>
          </span>
        </Link>
        <div className="course-switch">
          <span className="course-dot">二</span>
          <div>
            <strong>Chinese 2</strong>
            <small>10 lesson worlds</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {nav.map(([path, label, Icon]) => (
            <Link
              key={path}
              to={path}
              aria-current={url === path ? "page" : undefined}
              className={
                url === path || (path === "/learn" && (!!lesson || url === "/"))
                  ? "active"
                  : ""
              }
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
          <Link to="/offline" className={url === "/offline" ? "active" : ""}>
            <Download size={19} />
            Offline & install
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <Link to="/coverage" className="subtle-link">
            <ShieldCheck size={16} />
            Sources & coverage
          </Link>
          <Link to="/course/1" className="subtle-link">
            <BookOpen size={16} />
            Chinese 1 <span className="tiny-tag">SOON</span>
          </Link>
          <a
            href="https://github.com/Thiha-Lynn/chinese-studio"
            target="_blank"
            rel="noreferrer"
            className="subtle-link"
          >
            <Globe size={16} />
            Contribute on GitHub ↗
          </a>
          {session?.user ? (
            <button
              className="subtle-link"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  location.reload();
                } catch {
                  setError(
                    "Connect to the internet to sign out of your account.",
                  );
                }
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            session?.authReady && (
              <a className="subtle-link" href="/auth/google">
                Sign in with Google ↗
              </a>
            )
          )}
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-content">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
            <span className="breadcrumb-label">
              Chinese 2 <ChevronRight size={14} />
              {lesson
                ? `Lesson ${lesson.id}`
                : nav.find((n) => n[0] === url)?.[1] || "My studio"}
            </span>
          </div>
          <div className="row">
            <span className="sync-state" role="status">
              {online ? saveState : "Offline · " + saveState}
            </span>
            <span className="xp-pill">
              <Sparkles size={15} />
              {progress.xp} XP
            </span>
            <button
              className="icon-button depth-control"
              aria-label={
                immersive ? "Use calm flat visuals" : "Use immersive visuals"
              }
              onClick={() => setImmersive(!immersive)}
            >
              <Mountain size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main id="main" className="main-content" tabIndex={-1}>
          {!online && (
            <p className="soft-note" role="status">
              Offline · Your practice saves on this device. Downloaded resources
              are available.
            </p>
          )}
          {saveState.startsWith("Storage full") && (
            <p className="error" role="alert">
              Progress cannot be saved to this browser. Export a backup from My
              progress before closing.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {new URLSearchParams(location.search).has("auth") && (
            <p className="error">
              Google sign-in could not finish. You can continue studying on this
              device.
            </p>
          )}
          {(url === "/" || url === "/learn") && (
            <Home
              course={course}
              progress={progress}
              name={session?.user?.name?.split(" ")[0] || "learner"}
            />
          )}
          {lesson && (
            <LessonView
              key={lesson.id}
              lesson={lesson}
              course={course}
              progress={progress}
              setProgress={setProgress}
              open={openResource}
            />
          )}
          {url === "/vocabulary" && (
            <Vocabulary
              words={course.vocab}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {url === "/practice" && (
            <Practice
              course={course}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {url === "/oral" && (
            <Oral
              course={course}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {url === "/handwriting" && (
            <Suspense fallback={<p>Opening your writing desk…</p>}>
              <Glyphs
                words={course.vocab}
                progress={progress}
                setProgress={setProgress}
              />
            </Suspense>
          )}
          {url === "/resources" && (
            <Resources course={course} open={openResource} />
          )}
          {url === "/progress" && (
            <>
              <ProgressView
                progress={progress}
                words={course.vocab}
                setProgress={setProgress}
              />
              <AccountBackup
                session={session}
                progress={progress}
                setProgress={setProgress}
              />
            </>
          )}
          {url === "/offline" && <Offline />}
          {url === "/coverage" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">SOURCES & COVERAGE</span>
                <h1>Know what you’re learning.</h1>
                <p>
                  Original course materials and added practice, with their scope
                  made visible.
                </p>
              </div>
              <div className="coverage-list">
                {course.coverage.map((c) => (
                  <section className="panel" key={c.area}>
                    <span className="pill">{c.status}</span>
                    <h2>{c.area}</h2>
                    <p>{c.detail}</p>
                  </section>
                ))}
              </div>
              <section className="panel">
                <h2>Credits & licensing</h2>
                <p>
                  Original course materials and artwork: MFU Learning Innovation
                  Institute and Chinese 2 instructors, including Peng Liu.
                  Reused on the project owner’s confirmation of permission.
                  These materials retain their original rights and are not
                  relicensed under MIT.
                </p>
                <p>
                  Application code and original project contributions: MIT.
                  Hanzi Writer: MIT. Stroke data: Make Me a Hanzi / Arphic
                  Public License.
                </p>
                <a href="/library/glyphs/LICENSE">Stroke-data license</a> ·{" "}
                <a href="https://github.com/Thiha-Lynn/chinese-studio/blob/main/THIRD_PARTY_NOTICES.md">
                  Full notices ↗
                </a>
                <p>
                  Browser speech is synthesized; drills and self-ratings are
                  independent study aids.
                </p>
                <a
                  href="https://mdl.mfu.ac.th/#/v4/LS01/1"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open official MDL ↗
                </a>
              </section>
            </>
          )}
          {url === "/course/1" && (
            <Empty
              title="Chinese 1 is next."
              text="Waiting for the authorized Chinese 1 account or course export. Chinese 2 is available now."
            />
          )}
          {(url === "/privacy" || url === "/terms") && (
            <section className="panel legal">
              <h1>
                {url === "/privacy"
                  ? "Your learning, your privacy."
                  : "About Chinese Studio"}
              </h1>
              {url === "/privacy" ? (
                <>
                  <p>
                    Lessons are public and work without an account. Progress,
                    answers and display preferences are saved in this browser.
                    Offline downloads use browser storage; you can remove them
                    in Offline & install. Export or clear your progress in My
                    progress.
                  </p>
                  <p>
                    Optional Google sign-in shares your verified email, name and
                    account identifier with this server. Account backups are
                    copied only when you choose Save or Load in My progress.
                    Sessions last seven days. You can delete the server account
                    separately from device progress.
                  </p>
                  <p>
                    AI questions and selected lesson context go to DeepSeek only
                    when you send a question. Account names and email are not
                    included. Avoid personal information. Replies are not
                    official assessments. The server stores usage counts, not
                    chats.
                  </p>
                  <p>
                    Microphone recordings stay on your device. Download them
                    before leaving the activity. Hosting logs contain connection
                    metadata, but authentication callback query strings are
                    omitted. No advertising trackers are used.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    An independent learning companion, not the official MFU
                    portal. This app does not submit assignments, attendance or
                    grades to MFU.
                  </p>
                  <p>
                    Application code is MIT licensed. MFU materials and stroke
                    data retain their separate rights; see Sources & coverage
                    and the repository notices. Grammar examples and annotated
                    vocabulary are learning aids and may be corrected through
                    contributions.
                  </p>
                  <p>
                    All ten Chinese 2 classroom lessons are included. Chinese 1
                    and parts of the MDL media/activity collection are pending.
                    Online AI and Google services require operator configuration
                    and an internet connection.
                  </p>
                </>
              )}
              <Link to="/learn" className="btn">
                Back to learning
              </Link>
            </section>
          )}
          {!allowed.includes(url) && !lesson && (
            <Empty
              title="This page isn’t here."
              text="Choose a lesson from My worlds."
            />
          )}
        </main>
        <footer>
          <span>Small steps. A little Chinese, every day.</span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">About & credits</Link>
            <a href="https://github.com/Thiha-Lynn/chinese-studio">
              MIT source ↗
            </a>
          </div>
        </footer>
      </div>
      <Tutor
        lesson={lesson?.id}
        activity={
          lesson
            ? "Lesson study"
            : nav.find((n) => n[0] === url)?.[1] || "Study"
        }
        available={!!session?.aiReady && !!session?.user && online}
      />
      <dialog
        className="resource-dialog"
        ref={dialog}
        onCancel={() => setViewer("")}
      >
        <div className="row between">
          <a className="btn secondary" href={viewer} download>
            Download file
          </a>
          <button
            className="icon-button"
            aria-label="Close resource"
            onClick={() => setViewer("")}
          >
            <X />
          </button>
        </div>
        {/\.(png|webp)$/i.test(viewer) ? (
          <img src={viewer} alt="Course resource" />
        ) : (
          <iframe title="Course resource" src={viewer} />
        )}
        <small>
          If this browser cannot display the document, use Download file.
        </small>
      </dialog>
    </div>
  );
}
function AccountBackup({
  session,
  progress,
  setProgress,
}: {
  session: any;
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
}) {
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState<Progress | null>(null),
    [busy, setBusy] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api("/api/progress", {
        method: "PUT",
        body: JSON.stringify(progress),
      });
      setMessage("A copy of this device’s progress is saved to your account.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Account backup</h2>
      <p>
        Progress stays on this device. Save a copy to your account, then load it
        on another device. Loading a backup replaces the current device’s
        progress; export first to keep both.
      </p>
      {bundledApp ? (
        <p>
          Use Export progress and Restore backup to move your learning between
          apps. Optional account backups are available on the{" "}
          <a
            href="https://chinese.ztvmm.live/progress"
            target="_blank"
            rel="noreferrer"
          >
            live website
          </a>{" "}
          when sign-in is configured.
        </p>
      ) : session?.user ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <div className="row">
            <button className="btn" disabled={busy} onClick={save}>
              Save device progress to account
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  setPending(parseProgress(await api("/api/progress")));
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Load account backup
            </button>
          </div>
          {pending && (
            <div className="soft-note">
              <p>
                This backup has {pending.xp} XP and{" "}
                {Object.values(pending.known).filter(Boolean).length} learned
                words. Replace this device’s progress?
              </p>
              <button
                className="btn"
                onClick={() => {
                  setProgress(() => pending);
                  setPending(null);
                  setMessage("Account backup loaded on this device.");
                }}
              >
                Replace device progress
              </button>
              <button className="text-button" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          )}
          <hr />
          {deleteConfirm ? (
            <>
              <p>
                Delete your server account and backup? Device progress will
                remain.
              </p>
              <button
                className="btn danger"
                onClick={async () => {
                  try {
                    await api("/api/account", { method: "DELETE" });
                    location.reload();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Delete server account
              </button>
              <button
                className="text-button"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="text-button"
              onClick={() => setDeleteConfirm(true)}
            >
              Delete server account
            </button>
          )}
        </>
      ) : session?.authReady ? (
        <a className="btn" href="/auth/google">
          Sign in with Google
        </a>
      ) : (
        <p>
          Account backups are not configured on this host. Use Export progress
          and Restore backup to transfer your learning between devices.
        </p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}

function Home({
  course,
  progress,
  name,
}: {
  course: Course;
  progress: Progress;
  name: string;
}) {
  const learned = Object.values(progress.known).filter(Boolean).length;
  const next =
    course.lessons.find((l) =>
      course.vocab.some((w) => w.lesson === l.id && !progress.known[w.id]),
    ) || course.lessons[0];
  return (
    <>
      <div className="welcome-line">
        <span>
          你好, {name} <span className="wave">✦</span>
        </span>
        <span>YOUR NEXT LITTLE ADVENTURE AWAITS</span>
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">LEARN A LITTLE. GROW A LOT.</span>
          <h1>
            A new world,
            <br />
            one word at a time.
          </h1>
          <p>
            Step into familiar places. Find new ways to practise.
            <br className="desktop-only" /> Make Chinese part of your every day.
          </p>
          <div className="row hero-actions">
            <Link to={`/lesson/${next.id}`} className="btn">
              Continue learning <ArrowRight size={18} />
            </Link>
            <Link to="/oral" className="text-button">
              Oral test prep <Mic size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-world">
          <span className="hero-ring" />
          <span className="hero-platform" />
          <img src={next.art} alt={next.theme} />
          <div className="world-label">
            <span className="live-dot" /> LESSON{" "}
            {next.id.toString().padStart(2, "0")}
            <strong>{next.theme}</strong>
          </div>
          <span className="floating-spark hero-spark">✦</span>
        </div>
      </section>
      <div className="quick-stats">
        <div>
          <span className="stat-icon mint">
            <BookOpen />
          </span>
          <div>
            <strong>
              10 <small>worlds</small>
            </strong>
            <span>Room to keep growing</span>
          </div>
        </div>
        <div>
          <span className="stat-icon peach">
            <Layers />
          </span>
          <div>
            <strong>
              {learned} <small>/ {course.vocab.length} words</small>
            </strong>
            <span>A little more familiar</span>
          </div>
        </div>
        <div>
          <span className="stat-icon lavender">
            <Flame />
          </span>
          <div>
            <strong>
              {progress.streakDates.length} <small>study days</small>
            </strong>
            <span>Every visit counts</span>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CHOOSE YOUR NEXT CHAPTER</span>
          <h2>Your lesson worlds</h2>
        </div>
        <span className="muted">Chinese 2 · Lessons 1–10</span>
      </div>
      <div className="world-grid">
        {course.lessons.map((l, i) => {
          const words = course.vocab.filter((w) => w.lesson === l.id),
            n = words.filter((w) => progress.known[w.id]).length;
          return (
            <Link
              key={l.id}
              to={`/lesson/${l.id}`}
              className={"world-card tint-" + (i % 5)}
            >
              <div className="world-card-top">
                <span>LESSON {String(l.id).padStart(2, "0")}</span>
                {l.id <= 5 && <span className="exam-tag">ORAL TEST 1</span>}
              </div>
              <div className="world-image">
                <span className="world-ground" />
                <img loading="lazy" src={l.art} alt="" />
              </div>
              <span className="lesson-theme">{l.theme}</span>
              <h3>{l.title}</h3>
              <div className="world-card-bottom">
                <div>
                  <span>
                    {words.length} words · {l.slides.length} slides
                  </span>
                  <div className="meter">
                    <span
                      style={{
                        width: `${words.length ? (n / words.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="round-arrow">
                  <ArrowRight size={18} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="extra-grid">
        <Link to="/oral" className="extra-card peach">
          <Mic />
          <div>
            <span className="eyebrow">FIND YOUR VOICE</span>
            <h2>Your 15-point rehearsal</h2>
            <p>Five words. Five questions. A more confident you.</p>
          </div>
          <ArrowRight />
        </Link>
        <Link to="/handwriting" className="extra-card mint">
          <PenLine />
          <div>
            <span className="eyebrow">SOMETHING EXTRA</span>
            <h2>Make your mark.</h2>
            <p>Bring each character to life, stroke by stroke.</p>
          </div>
          <ArrowRight />
        </Link>
      </div>
    </>
  );
}
function WordCard({
  word,
  progress,
  setProgress,
}: {
  word: Word;
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <article className="vocab-card">
      <button
        className={"mini-flip " + (flipped ? "turned" : "")}
        onClick={() => setFlipped(!flipped)}
        aria-label={`Flip ${word.hanzi}`}
      >
        <div className="mini-flip-inner">
          <div className="mini-front">
            {word.image ? (
              <img
                loading="lazy"
                src={word.image}
                alt="Vocabulary illustration"
              />
            ) : (
              <span className="type-art">{word.hanzi}</span>
            )}
            <strong lang="zh" className="hanzi">
              {word.hanzi}
            </strong>
            <span className="pinyin">{word.pinyin}</span>
          </div>
          <div className="mini-back">
            <strong className="hanzi" lang="zh">
              {word.hanzi}
            </strong>
            <span className="pinyin">{word.pinyin}</span>
            <h3>{word.meaning}</h3>
            {word.note && <small>{word.note}</small>}
          </div>
        </div>
      </button>
      <div className="card-controls">
        <button
          className="icon-button"
          onClick={() => speak(word.audioText || word.hanzi)}
          aria-label={`Listen to ${word.hanzi}`}
        >
          <Volume2 size={17} />
        </button>
        <small>L{word.lesson} · Tap to flip</small>
        <button
          className={
            "icon-button " + (progress.known[word.id] ? "learned" : "")
          }
          onClick={() =>
            setProgress((p) => review(p, word.id, !p.known[word.id]))
          }
          aria-label={
            progress.known[word.id]
              ? `Mark ${word.hanzi} for review`
              : `Mark ${word.hanzi} learned`
          }
          aria-pressed={!!progress.known[word.id]}
        >
          <Check size={17} />
        </button>
      </div>
    </article>
  );
}
function Vocabulary({
  words,
  progress,
  setProgress,
  lessonOnly = false,
}: {
  words: Word[];
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
  lessonOnly?: boolean;
}) {
  const [q, setQ] = useState(""),
    [lesson, setLesson] = useState(0),
    [only, setOnly] = useState(false),
    [page, setPage] = useState(0);
  const filtered = words.filter(
    (w) =>
      (!lesson || lesson === w.lesson) &&
      (!only || !progress.known[w.id]) &&
      `${w.hanzi} ${w.pinyin} ${w.meaning}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      {!lessonOnly && (
        <div className="page-heading">
          <span className="eyebrow">MEET THE WORDS AGAIN</span>
          <h1>Little cards. Lasting memories.</h1>
          <p>
            Flip, listen, and keep the words you know. Come back for the rest.
          </p>
        </div>
      )}
      <div className="vocab-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Search vocabulary"
            placeholder="Search characters, pinyin, meaning…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {!lessonOnly && (
          <select
            aria-label="Filter vocabulary by lesson"
            value={lesson}
            onChange={(e) => {
              setLesson(+e.target.value);
              setPage(0);
            }}
          >
            <option value={0}>All lessons</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option value={i + 1} key={i}>
                Lesson {i + 1}
              </option>
            ))}
          </select>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={only}
            onChange={(e) => {
              setOnly(e.target.checked);
              setPage(0);
            }}
          />{" "}
          Still learning
        </label>
      </div>
      <p className="muted">
        {filtered.length} words · Original artwork where captured; classroom
        vocabulary is labelled in the source report.
      </p>
      <div className="vocab-grid">
        {filtered.slice(page * 12, page * 12 + 12).map((w) => (
          <WordCard
            word={w}
            key={w.id}
            progress={progress}
            setProgress={setProgress}
          />
        ))}
      </div>
      {!filtered.length && (
        <section className="panel empty">
          <Search />
          <h2>No words found.</h2>
          <p>Try a different word or remove a filter.</p>
        </section>
      )}
      <div className="row center pagination">
        <button
          className="btn secondary"
          disabled={!page}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft size={17} /> Previous
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(filtered.length / 12))}
        </span>
        <button
          className="btn secondary"
          disabled={(page + 1) * 12 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next <ChevronRight size={17} />
        </button>
      </div>
    </>
  );
}
function LessonView({
  lesson: l,
  course,
  progress,
  setProgress,
  open,
}: {
  lesson: Lesson;
  course: Course;
  progress: Progress;
  setProgress: (f: (p: Progress) => Progress) => void;
  open: (s: string) => void;
}) {
  const [tab, setTab] = useState("start"),
    [slide, setSlide] = useState(0);
  return (
    <>
      <Link to="/learn" className="text-button">
        ← Back to my worlds
      </Link>
      <section className="lesson-hero">
        <div>
          <span className="eyebrow">
            LESSON {String(l.id).padStart(2, "0")} · {l.theme}
          </span>
          <h1>{l.title}</h1>
          <p className="hanzi" lang="zh">
            {l.hanzi}
          </p>
          <div className="row">
            <span className="pill">
              {course.vocab.filter((w) => w.lesson === l.id).length} vocabulary
              cards
            </span>
            <span className="pill">{l.slides.length} source slides</span>
          </div>
        </div>
        <div className="lesson-art">
          <span className="hero-platform" />
          <img src={l.art} alt={l.theme} />
        </div>
      </section>
      <div className="tabs">
        {[
          ["start", "Start"],
          ["words", "Vocabulary"],
          ["notes", "Lesson notes"],
          ["practice", "Practice & test"],
          ["assignments", "Assignments"],
          ["resources", "Resources"],
        ].map(([k, t]) => (
          <button
            key={k}
            className={tab === k ? "active" : ""}
            onClick={() => setTab(k)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "start" && (
        <>
          <div className="lesson-start">
            <section className="panel">
              <span className="eyebrow">YOUR WAY THROUGH THIS WORLD</span>
              <h2>First, get familiar.</h2>
              <p>
                Meet the words, explore the original lesson, then make a little
                time to practise.
              </p>
              <div className="study-steps">
                {[
                  [
                    "words",
                    "01",
                    "Meet the vocabulary",
                    "Flip the cards and say each word.",
                  ],
                  [
                    "notes",
                    "02",
                    "Explore the lesson",
                    "Read the classroom slides and grammar.",
                  ],
                  [
                    "practice",
                    "03",
                    "Make it stick",
                    "Try a short practice round.",
                  ],
                ].map(([k, n, t, d]) => (
                  <button key={k} onClick={() => setTab(k)}>
                    <span className="round-num">{n}</span>
                    <div>
                      <strong>{t}</strong>
                      <small>{d}</small>
                    </div>
                    <ArrowRight size={19} />
                  </button>
                ))}
              </div>
            </section>
            <aside className="panel lesson-note">
              <img src="/art/Fox.webp" alt="" />
              <h2>Say it out loud.</h2>
              <p>
                Even a quiet practice counts. Try answering in a full sentence,
                then change one detail to make it your own.
              </p>
              <Link
                className="btn secondary"
                to={l.id <= 5 ? "/oral" : "/practice"}
              >
                {l.id <= 5
                  ? "Prepare my oral answers"
                  : "Explore more practice"}{" "}
                <ArrowRight size={17} />
              </Link>
            </aside>
          </div>
          {l.dialogue && (
            <section className="panel dialogue">
              <h2>From the MDL conversation</h2>
              {l.dialogue.map((s, i) => (
                <div className="dialogue-line" key={i}>
                  <span>{i % 2 === 0 ? "A" : "B"}</span>
                  <p lang="zh">{s}</p>
                  <button
                    className="icon-button"
                    onClick={() => speak(s)}
                    aria-label={"Listen: " + s}
                  >
                    <Volume2 size={17} />
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {tab === "words" && (
        <Vocabulary
          words={course.vocab.filter((w) => w.lesson === l.id)}
          progress={progress}
          setProgress={setProgress}
          lessonOnly
        />
      )}
      {tab === "notes" && (
        <>
          <div className="grammar-grid">
            {l.grammar.map(([title, detail, zh, en]) => (
              <section className="panel" key={title}>
                <h2>{title}</h2>
                <p>{detail}</p>
                <div className="soft-note">
                  <p className="hanzi" lang="zh">
                    {zh}
                  </p>
                  <p>{en}</p>
                  <button
                    className="icon-button"
                    aria-label={"Listen: " + zh}
                    onClick={() => speak(zh)}
                  >
                    <Volume2 size={17} />
                  </button>
                </div>
              </section>
            ))}
          </div>
          <section className="panel slide-reader">
            <div className="row between">
              <div>
                <span className="eyebrow">ORIGINAL CLASSROOM TEXT</span>
                <h2>Every slide, at your pace.</h2>
              </div>
              <span className="pill">
                {slide + 1} / {l.slides.length}
              </span>
            </div>
            <p className="muted">
              Text extracted from the original slide deck. Open its PDF for the
              full visual layout.
            </p>
            <pre>{l.slides[slide]?.text}</pre>
            <div className="row between">
              <button
                className="btn secondary"
                disabled={!slide}
                onClick={() => setSlide((s) => s - 1)}
              >
                <ChevronLeft size={17} /> Previous
              </button>
              <select
                aria-label="Jump to slide"
                value={slide}
                onChange={(e) => setSlide(+e.target.value)}
              >
                {l.slides.map((_, i) => (
                  <option value={i} key={i}>
                    Slide {i + 1}
                  </option>
                ))}
              </select>
              <button
                className="btn secondary"
                disabled={slide === l.slides.length - 1}
                onClick={() => setSlide((s) => s + 1)}
              >
                Next <ChevronRight size={17} />
              </button>
            </div>
          </section>
        </>
      )}
      {tab === "practice" && (
        <Practice
          course={course}
          progress={progress}
          setProgress={setProgress}
          initialLesson={l.id}
        />
      )}{" "}
      {tab === "assignments" && (
        <>
          <div className="section-heading">
            <div>
              <h2>Your practice desk</h2>
              <p>
                Open the original worksheet and keep your working notes here.
              </p>
            </div>
          </div>
          <ResourceList
            resources={l.resources.filter((r) =>
              r.kind.toLowerCase().includes("worksheet"),
            )}
            open={open}
          />
          <section className="panel">
            <label className="field-label" htmlFor="assignment-notes">
              My Lesson {l.id} working notes
            </label>
            <textarea
              id="assignment-notes"
              rows={10}
              maxLength={2000}
              value={progress.answers[`assignment-${l.id}`] || ""}
              onChange={(e) =>
                setProgress((p) => ({
                  ...p,
                  answers: {
                    ...p.answers,
                    [`assignment-${l.id}`]: e.target.value,
                  },
                }))
              }
              placeholder="Draft your answers or questions for your lecturer…"
            />
            <small>
              Saved on this device. This does not submit an assignment to MFU.
            </small>
          </section>
        </>
      )}{" "}
      {tab === "resources" && (
        <>
          <ResourceList resources={l.resources} open={open} />
          {l.summaries.length > 0 && (
            <div className="summary-grid">
              {l.summaries.map((s) => (
                <button onClick={() => open(s)} key={s}>
                  <img
                    src={s}
                    alt={`Original Lesson ${l.id} summary`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="soft-note">
            <p>
              {l.coverage ||
                "Classroom files and captured MDL material are listed here. For official graded activities and any unavailable audio or video, continue on MDL."}
            </p>
            <a
              href="https://mdl.mfu.ac.th/#/v4/LS01/1"
              target="_blank"
              rel="noreferrer"
            >
              Open official MDL <ExternalLink size={14} />
            </a>
          </div>
        </>
      )}
    </>
  );
}
function ResourceList({
  resources,
  open,
}: {
  resources: { name: string; url: string; kind: string }[];
  open: (s: string) => void;
}) {
  return (
    <div className="resource-list">
      {resources.map((r) => (
        <article className="resource-row" key={r.url}>
          <span className="file-icon">
            <FolderOpen />
          </span>
          <div>
            <strong>{r.name}</strong>
            <small>{r.kind}</small>
          </div>
          <button className="btn secondary small" onClick={() => open(r.url)}>
            Open <ExternalLink size={14} />
          </button>
          <a
            className="icon-button"
            href={r.url}
            download
            aria-label={"Download " + r.name}
          >
            <Download size={18} />
          </a>
        </article>
      ))}
    </div>
  );
}
function Resources({
  course,
  open,
}: {
  course: Course;
  open: (s: string) => void;
}) {
  const [lesson, setLesson] = useState(0);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ALL YOUR MATERIAL, TOGETHER</span>
        <h1>Your little library.</h1>
        <p>
          Original slides, worksheets and oral preparation. Read here or take a
          copy with you.
        </p>
      </div>
      <select
        aria-label="Filter resources by lesson"
        value={lesson}
        onChange={(e) => setLesson(+e.target.value)}
      >
        <option value={0}>All lessons</option>
        {course.lessons.map((l) => (
          <option key={l.id} value={l.id}>
            Lesson {l.id} · {l.theme}
          </option>
        ))}
      </select>
      {course.lessons
        .filter((l) => !lesson || l.id === lesson)
        .map((l) => (
          <section className="resource-section" key={l.id}>
            <h2>
              Lesson {l.id} <span>{l.title}</span>
            </h2>
            <ResourceList resources={l.resources} open={open} />
          </section>
        ))}
      <section className="resource-section">
        <h2>Oral Test 1</h2>
        <ResourceList
          resources={[
            {
              name: "Oral Test 1 · teacher preparation sheet",
              url: "/library/resources/oral test 1.docx",
              kind: "Original DOCX",
            },
            {
              name: "Oral Test 1 · test format",
              url: "/library/resources/oral test1.png",
              kind: "Original announcement",
            },
            {
              name: "Lessons 1–5 · study guide",
              url: "/library/resources/study-guide.pdf",
              kind: "Added study guide · examples and pinyin",
            },
          ]}
          open={open}
        />
      </section>
    </>
  );
}
function ProgressView({
  progress,
  words,
  setProgress,
}: {
  progress: Progress;
  words: Word[];
  setProgress: (f: (p: Progress) => Progress) => void;
}) {
  const [message, setMessage] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  async function download() {
    try {
      await saveFile(
        new Blob([JSON.stringify(progress, null, 2)], {
          type: "application/json",
        }),
        "chinese-studio-progress.json",
      );
    } catch {
      setMessage(
        "Export was cancelled or unavailable. Your progress is still saved on this device.",
      );
    }
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 250000) throw new Error("Progress file is too large.");
      const p = parseProgress(JSON.parse(await file.text()));
      setProgress(() => p);
      setMessage("Progress restored.");
    } catch (e) {
      setMessage(
        "Invalid progress backup. Use an exported Chinese Studio JSON file.",
      );
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">LOOK HOW FAR YOU’VE COME</span>
        <h1>Every small step counts.</h1>
        <p>Your words, practice moments and growing confidence.</p>
      </div>
      <div className="progress-stats">
        {[
          [
            Object.values(progress.known).filter(Boolean).length,
            "words learned",
          ],
          [progress.xp, "practice XP"],
          [progress.streakDates.length, "study days"],
          [Object.keys(progress.glyphs).length, "characters written"],
        ].map(([n, t]) => (
          <section className="panel" key={t}>
            <strong>{n}</strong>
            <span>{t}</span>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>A world-by-world view</h2>
        {Array.from({ length: 10 }, (_, i) => {
          const pool = words.filter((w) => w.lesson === i + 1),
            known = pool.filter((w) => progress.known[w.id]).length;
          return (
            <div className="progress-line" key={i}>
              <strong>Lesson {i + 1}</strong>
              <div className="meter">
                <span
                  style={{
                    width: `${pool.length ? (known / pool.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <small>
                {known} / {pool.length}
              </small>
            </div>
          );
        })}
      </section>
      <section className="panel">
        <h2>Your recent practice</h2>
        {progress.history.length ? (
          progress.history.slice(0, 12).map((h, i) => (
            <div className="history-row" key={i}>
              <span>{h.type}</span>
              <small>{new Date(h.date).toLocaleDateString()}</small>
              <strong>
                {h.score} / {h.total}
              </strong>
            </div>
          ))
        ) : (
          <p>Your first practice round is waiting for you.</p>
        )}
      </section>
      <section className="panel">
        <h2>Your progress belongs to you.</h2>
        <p>Download a backup or restore a previous Chinese Studio export.</p>
        <div className="row">
          <button className="btn secondary" onClick={download}>
            <Download size={17} /> Export progress
          </button>
          <label className="btn secondary">
            Restore backup
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => restore(e.target.files?.[0])}
            />
          </label>
        </div>
        {message && <p role="status">{message}</p>}
        <hr />
        {confirmDelete ? (
          <div>
            <p>
              Clear this device’s saved answers and practice history? This
              cannot be undone. Download a backup first if you want to keep it.
            </p>
            <div className="row">
              <button
                className="btn danger"
                onClick={async () => {
                  try {
                    localStorage.removeItem("studio-device-progress");
                    location.href = "/";
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Clear device progress
              </button>
              <button
                className="btn secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Keep my progress
              </button>
            </div>
          </div>
        ) : (
          <button
            className="text-button muted"
            onClick={() => setConfirmDelete(true)}
          >
            Clear device progress
          </button>
        )}
      </section>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel empty">
      <h1>{title}</h1>
      <p>{text}</p>
      <Link to="/learn" className="btn">
        Back to my worlds
      </Link>
    </section>
  );
}
