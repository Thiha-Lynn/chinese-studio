export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
// Capture once at startup; the browser can emit this before /offline is opened.
let pending: InstallPrompt | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pending = event as InstallPrompt;
    window.dispatchEvent(new Event("esc-install-ready"));
  });
  window.addEventListener("appinstalled", () => {
    pending = null;
    window.dispatchEvent(new Event("esc-install-ready"));
  });
}
export const getInstallPrompt = () => pending;
export function clearInstallPrompt() {
  pending = null;
  window.dispatchEvent(new Event("esc-install-ready"));
}
