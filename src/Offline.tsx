import { useEffect, useState } from "react";
import { bundledApp } from "./native";
type Pack = {
  version: string;
  core: string[];
  files: { url: string; bytes: number }[];
};
export default function Offline() {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [pack, setPack] = useState<Pack | null>(null),
    [installed, setInstalled] = useState(false),
    [count, setCount] = useState(0),
    [install, setInstall] = useState<any>(null);
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
    const f = (e: Event) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", f);
    return () => window.removeEventListener("beforeinstallprompt", f);
  }, []);
  useEffect(() => {
    if (bundledApp || !pack || !("caches" in window)) return;
    caches.open("chinese-pack-" + pack.version).then(async (c) => {
      const keys = await c.keys();
      setInstalled(
        pack.files.every((f) =>
          keys.some((k) => k.url === new URL(f.url, location.origin).href),
        ),
      );
    });
  }, [pack]);
  async function download() {
    if (!pack || busy) return;
    setBusy(true);
    setStatus("Saving lessons and resources. Keep this page open.");
    setCount(0);
    try {
      await navigator.serviceWorker.ready;
      const cache = await caches.open("chinese-pack-" + pack.version);
      let complete = 0;
      for (let i = 0; i < pack.files.length; i += 4) {
        await Promise.all(
          pack.files.slice(i, i + 4).map(async (f) => {
            if (!(await cache.match(f.url))) {
              const r = await fetch(f.url);
              if (!r.ok)
                throw Error(
                  "A resource could not be downloaded. Please retry.",
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
      setStatus("All study materials are saved for offline use.");
    } catch (e) {
      setStatus(
        "Download incomplete. Check your connection and available device storage, then retry. Already saved files will be reused.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!pack) return;
    for (const name of await caches.keys()) {
      if (name.startsWith("chinese-pack-")) await caches.delete(name);
    }
    setInstalled(false);
    setCount(0);
    setStatus("Downloaded resources removed. Your progress is unchanged.");
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
            Save all ten lessons, vocabulary artwork, stroke guides and
            downloadable course files on this device.
          </p>
          <p>
            {pack
              ? `${Math.ceil(pack.files.reduce((n, f) => n + f.bytes, 0) / 1e6)} MB · ${pack.files.length} files`
              : "Checking download size…"}
          </p>
          {!bundledApp && (
            <button
              className="btn"
              disabled={busy || !pack || !("serviceWorker" in navigator)}
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
              max={pack?.files.length}
            />
          )}
          <p role="status">
            {bundledApp
              ? "All lessons, vocabulary, stroke guides and course documents are included with this app. No download is needed."
              : status ||
                (installed
                  ? "All resources are saved on this device."
                  : "The app and lesson text save automatically after your first online visit.")}{" "}
          </p>
          {installed && (
            <button className="text-button" onClick={remove}>
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
            {bundledApp
              ? "Updates and other devices"
              : "Install Chinese Studio"}
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
                await install.prompt();
                setInstall(null);
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
          <h3>Download an app</h3>
          <ul className="app-downloads">
            {[
              ["Windows · Intel / AMD", "win-x64.exe"],
              ["Windows · ARM", "win-arm64.exe"],
              ["Mac · Apple Silicon", "mac-arm64.dmg"],
              ["Mac · Intel", "mac-x64.dmg"],
              ["Linux · Intel / AMD", "linux-x64.AppImage"],
              ["Linux · ARM", "linux-arm64.AppImage"],
              ["Android · phone or tablet", "android.apk"],
            ].map(([label, file]) => (
              <li key={file}>
                <a
                  href={
                    "https://github.com/Thiha-Lynn/chinese-studio/releases/download/v1.1.0/chinese-studio-1.1.0-" +
                    file
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {label} ↗
                </a>
              </li>
            ))}
          </ul>
          <small>
            Windows 10+ (ARM: 11), macOS 13+, Ubuntu 24.04, Android 9+ with an
            updated WebView. Windows and Mac packages are unsigned. iPhone and
            iPad use Add to Home Screen.
          </small>
          <a
            href="https://github.com/Thiha-Lynn/chinese-studio/releases"
            target="_blank"
            rel="noreferrer"
          >
            Download Windows, Mac, Linux and Android apps ↗
          </a>
        </section>
      </div>
    </>
  );
}
