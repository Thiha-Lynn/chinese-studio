import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { bundledApp } from "./native";

export default function AppUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const applying = useRef(false);
  useEffect(() => {
    if (bundledApp || !import.meta.env.PROD || !("serviceWorker" in navigator))
      return;
    let disposed = false;
    const changed = () => {
      if (applying.current) location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const ready = () => {
          if (!disposed && registration.waiting)
            setWaiting(registration.waiting);
        };
        ready();
        registration.addEventListener("updatefound", () => {
          registration.installing?.addEventListener("statechange", ready);
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
  if (!waiting) return null;
  return (
    <div className="soft-note row between" role="status">
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
    </div>
  );
}
