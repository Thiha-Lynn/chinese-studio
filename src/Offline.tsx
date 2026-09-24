import { useEffect, useState } from "react";
import { bundledApp } from "./native";
import { brand, installers, releaseFile } from "./brand";
import { getInstallPrompt, clearInstallPrompt } from "./install";
import { Download, ArrowUpRight, CheckCircle2 } from "lucide-react";
type Pack = {
  version: string;
  core: string[];
  videos?: { url: string; bytes: number }[];
  files: { url: string; bytes: number }[];
};
export default function Offline() {
  const [includeVideos, setIncludeVideos] = useState(false);
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [pack, setPack] = useState<Pack | null>(null),
    [installed, setInstalled] = useState(false),
    [count, setCount] = useState(0),
    [install, setInstall] = useState(getInstallPrompt);
  const selectedFiles = pack
    ? [...pack.files, ...(includeVideos ? pack.videos || [] : [])]
    : [];
  useEffect(() => {
    fetch("/offline-manifest.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setPack)
      .catch(() =>
        setStatus("Offline downloads are available in the built app."),
      );
    const f = () => setInstall(getInstallPrompt());
    window.addEventListener("esc-install-ready", f);
    return () => window.removeEventListener("esc-install-ready", f);
  }, []);
  useEffect(() => {
    if (bundledApp || !pack || !("caches" in window)) return;
    caches
      .open("chinese-pack-" + pack.version)
      .then(async (c) => {
        const keys = await c.keys();
        setInstalled(
          [...pack.files, ...(includeVideos ? pack.videos || [] : [])].every(
            (f) =>
              keys.some((k) => k.url === new URL(f.url, location.origin).href),
          ),
        );
      })
      .catch(() =>
        setStatus(
          "Browser storage is unavailable. Try a regular browser window or download an app below.",
        ),
      );
  }, [pack, includeVideos]);
  async function download() {
    if (!pack || busy) return;
    setBusy(true);
    setStatus("Saving lessons and resources. Keep this page open.");
    setCount(0);
    try {
      if (!navigator.serviceWorker?.controller) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active)
          throw Error("Offline setup is not ready. Reload and retry.");
      }
      const cache = await caches.open("chinese-pack-" + pack.version);
      let complete = 0;
      for (let i = 0; i < selectedFiles.length; i += 4) {
        await Promise.all(
          selectedFiles.slice(i, i + 4).map(async (f) => {
            if (!(await cache.match(f.url))) {
              const r = await fetch(f.url);
              if (!r.ok)
                throw Error(
                  `Could not download ${f.url} (HTTP ${r.status}).`,
                );
              await cache.put(f.url, r);
            }
            setCount(++complete);
          }),
        );
      }
      navigator.storage?.persist?.().catch(() => {});
      for (const name of await caches.keys()) {
        if (
          name.startsWith("chinese-pack-") &&
          name !== "chinese-pack-" + pack.version
        )
          await caches.delete(name);
      }
      setInstalled(true);
      setStatus("Selected study materials are saved for offline use.");
    } catch (e) {
      setStatus(
        `Download incomplete. ${e instanceof Error ? e.message : "Check your connection and available device storage."} Retry to reuse saved files.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!pack || busy) return;
    setBusy(true);
    try {
      for (const name of await caches.keys()) {
        if (name.startsWith("chinese-pack-")) await caches.delete(name);
      }
      setInstalled(false);
      setCount(0);
      setStatus("Downloaded resources removed. Your progress is unchanged.");
    } catch {
      setStatus(
        "Could not remove saved resources. Check browser storage permissions and retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">LEARN WHEREVER YOU ARE</span>
        <h1>Take your lessons with you.</h1>
        <p>The same study desk on your computer, tablet and phone.</p>
      </div>
      <div className="offline-grid">
        <section className="panel">
          <h2>
            {bundledApp ? "Ready for offline study" : "Save for offline study"}
          </h2>
          <p>
            Save Chinese 1 and Chinese 2 lessons, original audio, vocabulary
            artwork, stroke guides and downloadable course files on this device.
          </p>
          <p>
            {pack
              ? `${Math.ceil(selectedFiles.reduce((n, f) => n + f.bytes, 0) / 1e6)} MB · ${selectedFiles.length} files`
              : "Checking download size…"}
          </p>
          {!bundledApp && !!pack?.videos?.length && (
            <label>
              <input
                type="checkbox"
                checked={includeVideos}
                disabled={busy}
                onChange={(e) => setIncludeVideos(e.target.checked)}
              />{" "}
              Include {pack.videos.length} original videos (
              {Math.ceil(pack.videos.reduce((n, f) => n + f.bytes, 0) / 1e6)} MB
              extra)
            </label>
          )}
          {!bundledApp && (
            <button
              className="btn"
              disabled={
                busy ||
                !pack ||
                !("serviceWorker" in navigator) ||
                !("caches" in window)
              }
              onClick={download}
            >
              {busy
                ? "Downloading…"
                : installed
                  ? "Check saved materials"
                  : "Download all lessons"}
            </button>
          )}
          {busy && (
            <progress
              aria-label="Offline download progress"
              value={count}
              max={selectedFiles.length}
            />
          )}
          <p role="status">
            {bundledApp
              ? "All lessons, vocabulary, stroke guides and course documents are included with this app. No download is needed."
              : status ||
                (installed
                  ? "Selected resources are saved on this device."
                  : "The app and lesson text save automatically after your first online visit.")}{" "}
          </p>
          {installed && (
            <button className="text-button" disabled={busy} onClick={remove}>
              Remove downloaded resources
            </button>
          )}
          <small>
            Your browser may clear storage when space is low. Export your
            progress regularly. Each browser and installed app can have separate
            storage.
          </small>
        </section>
        <section className="panel">
          <h2>
            {bundledApp ? "Updates and other devices" : "Install ESC Chinese"}
          </h2>
          {bundledApp ? (
            <p>
              This installation already includes the complete available lesson
              pack. Download a newer release here when you want to update.
            </p>
          ) : install ? (
            <button
              className="btn"
              onClick={async () => {
                try {
                  await install.prompt();
                  const choice = await install.userChoice;
                  setStatus(
                    choice.outcome === "accepted"
                      ? "ESC Chinese installation started."
                      : "Installation dismissed. You can install from the browser menu later.",
                  );
                } catch {
                  setStatus("Use your browser’s Install app menu to continue.");
                } finally {
                  clearInstallPrompt();
                }
              }}
            >
              Install app
            </button>
          ) : (
            <p>
              On Chrome or Edge, use the browser’s Install app menu. On iPhone
              or iPad, use Share → Add to Home Screen. On supported Safari
              versions on Mac, choose Add to Dock.
            </p>
          )}
          <p>
            You can also keep using this website directly. Navigation, lessons
            and progress tools are the same.
          </p>
          <h3>Available offline</h3>
          <p>
            Saved lessons, vocabulary, drills, handwriting, oral rehearsal and
            progress import/export.
          </p>
          <h3>Needs a connection</h3>
          <p>
            Google sign-in, account backups and the DeepSeek tutor are available
            on the live website when configured. Links to the official portal
            need a connection. Speech playback depends on a Mandarin voice
            installed on your device.
          </p>
          <a
            className="text-button"
            href={brand.website}
            target="_blank"
            rel="noreferrer"
          >
            Open the live learning platform <ArrowUpRight size={16} />
          </a>
        </section>
      </div>
      <section
        className="download-section"
        aria-labelledby="app-download-heading"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              ESC CHINESE · VERSION {brand.version}
            </span>
            <h2 id="app-download-heading">One school. Every screen.</h2>
          </div>
          <span className="pill">
            <CheckCircle2 size={14} /> Lessons included
          </span>
        </div>
        <p>
          Desktop and Android apps include the complete available library.
          Choose the package that matches your device.
        </p>
        <div className="download-grid">
          {installers.map(({ platform, detail, options }) => (
            <section className="panel download-card" key={platform}>
              <Download size={23} />
              <h3>{platform}</h3>
              <p>{detail}</p>
              <div className="download-options">
                {options.map(([label, file]) => (
                  <a
                    className="btn secondary"
                    key={file}
                    href={releaseFile(file)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Download ${platform} ${label}`}
                  >
                    {label}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </section>
          ))}
          <section className="panel download-card">
            <Download size={23} />
            <h3>iPhone & iPad</h3>
            <p>Safari 16 or later · installable web app</p>
            <p>
              Open ESC in Safari, tap Share → Add to Home Screen, then save your
              lessons for offline study.
            </p>
          </section>
          <section className="panel download-card">
            <Download size={23} />
            <h3>Portable web app</h3>
            <p>Windows, macOS & Linux · Node.js 24–26</p>
            <a
              className="btn secondary"
              href={releaseFile("portable.zip")}
              target="_blank"
              rel="noreferrer"
            >
              Download ZIP <ArrowUpRight size={15} />
            </a>
          </section>
        </div>
        <div className="soft-note">
          <strong>Before installing</strong>
          <p>
            Windows and Mac packages do not have publisher signing or Apple
            notarization. Android APK updates use the existing app signing key.
            AppImage may need FUSE; Debian users can choose DEB. iPhone and iPad
            use the web app.
          </p>
          <p>
            Device progress stays on each device. Export a backup in My progress
            before moving to another device; earlier Chinese Studio backups
            still work.
          </p>
          <a
            href={`${brand.releases}/tag/v${brand.version}`}
            target="_blank"
            rel="noreferrer"
          >
            Release notes & checksums ↗
          </a>
        </div>
      </section>
    </>
  );
}
