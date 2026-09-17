import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { bundledApp } from "./native";

export default function AppUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const applying = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (bundledApp || !import.meta.env.PROD || !("serviceWorker" in navigator))
      return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const ready = () => {
      if (disposed) return;
      // An initial install briefly enters waiting before it activates. That is
      // not an update; only offer a different worker when a controller exists.
      const next = registration?.waiting;
      setWaiting(
        navigator.serviceWorker.controller &&
          next?.state === "installed" &&
          next !== navigator.serviceWorker.controller
          ? next
          : null,
      );
    };
    const changed = () => {
      if (applying.current) location.reload();
      else ready();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    navigator.serviceWorker
      .register("/sw.js")
      .then((value) => {
        registration = value;
        ready();
        value.addEventListener("updatefound", () => {
          value.installing?.addEventListener("statechange", ready);
        });
      })
      .catch(() => {
        if (!disposed)
          window.dispatchEvent(
            new CustomEvent("esc-notice", {
              detail:
                "Offline setup failed. Online lessons still work; reload to retry.",
            }),
          );
      });
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
    };
  }, []);
  if (!waiting || dismissed) return null;
  return (
    <div className="app-update row" role="status">
      <span>
        A new version of ESC Chinese is ready. Your saved progress stays on this
        device.
      </span>
      <button
        className="btn secondary"
        onClick={() => {
          applying.current = true;
          waiting.postMessage({ type: "ACTIVATE_UPDATE" });
        }}
      >
        <RefreshCw size={16} /> Update ESC
      </button>
      <button className="text-button" onClick={() => setDismissed(true)}>
        Later
      </button>
    </div>
  );
}
