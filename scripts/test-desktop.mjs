import { _electron as electron, expect } from "@playwright/test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const os = process.platform,
  arch = process.arch;
const executablePath =
  os === "darwin"
    ? `release/desktop/mac${arch === "arm64" ? "-arm64" : ""}/ESC Chinese.app/Contents/MacOS/ESC Chinese`
    : os === "win32"
      ? `release/desktop/win${arch === "arm64" ? "-arm64" : ""}-unpacked/ESC Chinese.exe`
      : `release/desktop/linux${arch === "arm64" ? "-arm64" : ""}-unpacked/chinese-studio-desktop`;
const data = await mkdtemp(path.join(tmpdir(), "chinese-native-test-"));
const options = {
  executablePath: process.env.STUDIO_EXECUTABLE || path.resolve(executablePath),
  args: os === "linux" ? ["--no-sandbox"] : [],
  env: { ...process.env, STUDIO_TEST_DATA: data },
};
let app;
const watchdog = setTimeout(() => {
  console.error("Native smoke test exceeded 120 seconds");
  app?.process().kill("SIGKILL");
  process.exit(1);
}, 120000);
try {
  app = await electron.launch(options);
  const page = await app.firstWindow();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator(".world-card")).toHaveCount(10);
  expect(await page.evaluate(() => typeof require)).toBe("undefined");
  expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
  // Block remote traffic: packaged lessons and resources must still function.
  await page.route("https://**", (r) => r.abort());
  await page.locator(".world-card").last().click();
  await page.getByRole("button", { name: "Lesson notes", exact: true }).click();
  await expect(page.locator(".slide-reader pre")).toContainText("Lesson 10");
  await page.goto("studio://app/handwriting");
  await expect(
    page.getByRole("button", { name: "Watch", exact: true }),
  ).toBeEnabled();
  const resources = await page.evaluate(async () => {
    const manifest = await (await fetch("/offline-manifest.json")).json();
    for (const file of manifest.files) {
      const r = await fetch(file.url);
      if (!r.ok || (await r.arrayBuffer()).byteLength !== file.bytes)
        throw Error("Missing resource: " + file.url);
    }
    return manifest.files.length;
  });
  expect(resources).toBeGreaterThan(500);
  await page.goto("studio://app/vocabulary");
  await page.getByLabel("Search vocabulary").fill("篮球");
  await page
    .getByRole("button", { name: /Mark .* learned/ })
    .first()
    .click();
  await page.goto("studio://app/progress");
  // Electron downloads use its native DownloadItem, not Playwright's browser
  // download event. Pick a test path to avoid opening the OS save dialog.
  const exportPath = path.join(data, "progress-export.json");
  await app.evaluate(({ session }, exportPath) => {
    globalThis.__exportState = "waiting";
    session.defaultSession.once("will-download", (event, item) => {
      item.setSavePath(exportPath);
      item.once("done", (event, state) => {
        globalThis.__exportState = state;
      });
    });
  }, exportPath);
  await page.getByRole("button", { name: "Export progress" }).click();
  await expect
    .poll(() => app.evaluate(() => globalThis.__exportState), {
      timeout: 20000,
    })
    .toBe("completed");
  const exported = JSON.parse(await readFile(exportPath, "utf8"));
  expect(Object.values(exported.known)).toContain(true);
  const nativeWindow = await app.browserWindow(page);
  await nativeWindow.evaluate((win) => win.setContentSize(390, 844));
  await expect.poll(() => page.evaluate(() => innerWidth)).toBe(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/native-${os}-${arch}.png`,
    fullPage: false,
  });
  expect(errors).toEqual([]);
  await app.close();
  app = null;
  app = await electron.launch(options);
  const reopened = await app.firstWindow();
  await reopened.goto("studio://app/vocabulary");
  await reopened.getByLabel("Search vocabulary").fill("篮球");
  await expect(
    reopened.getByRole("button", { name: /Mark .* for review/ }).first(),
  ).toBeVisible();
  console.log(
    `PASS: packaged ${os}/${arch}; ten lessons; ${resources} offline resources; handwriting; export; responsive layout; progress after app restart`,
  );
} finally {
  if (app) await app.close();
  clearTimeout(watchdog);
  await rm(data, { recursive: true, force: true });
}
