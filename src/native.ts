import { Capacitor, registerPlugin } from "@capacitor/core";
export const mobileApp = Capacitor.isNativePlatform();
export const bundledApp =
  mobileApp ||
  (typeof location !== "undefined" && location.protocol === "studio:");
const StudyFiles = registerPlugin<{
  openResource(options: { path: string }): Promise<void>;
  speak(options: { text: string }): Promise<void>;
}>("StudyFiles");
export const openMobileResource = (path: string) =>
  StudyFiles.openResource({ path: decodeURIComponent(path) });
export const speakMobile = (text: string) => StudyFiles.speak({ text });
export async function saveFile(blob: Blob, filename: string) {
  if (mobileApp) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: filename,
      files: [uri],
      dialogTitle: "Save or share your file",
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// Native WebViews do not implement browser blob downloads. Intercept only
// explicit download links; normal navigation and file inputs stay unchanged.
export function installMobileDownloads() {
  if (!mobileApp) return;
  document.addEventListener("click", (event) => {
    const a = (event.target as Element).closest?.(
      "a[download]",
    ) as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href);
    if (
      url.origin === location.origin &&
      url.pathname.startsWith("/library/")
    ) {
      event.preventDefault();
      void openMobileResource(url.pathname).catch(() =>
        alert(
          "Could not open this resource. Install an app that can read PDF or Office files.",
        ),
      );
    } else if (url.protocol === "blob:") {
      event.preventDefault();
      void fetch(a.href)
        .then((r) => r.blob())
        .then((b) => saveFile(b, a.download))
        .catch(() => alert("File sharing was cancelled or unavailable."));
    }
  });
}
