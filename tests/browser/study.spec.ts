import { spawn } from "node:child_process";
import path from "node:path";
import { test, expect } from "@playwright/test";
async function go(page: any, path: string) {
  await page.goto(path);
  await expect(page.locator("#main")).toBeVisible();
}
test("public lessons, theme, navigation and mobile layout", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, "/learn");
  await expect(page.locator(".world-card")).toHaveCount(10);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: `test-results/${info.project.name}-home-dark.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.screenshot({
    path: `test-results/${info.project.name}-home-light.png`,
    fullPage: true,
  });
  await page.locator(".world-card").last().click();
  await expect(
    page.getByRole("heading", { name: "Flying to Thailand" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lesson notes", exact: true }).click();
  await expect(page.locator(".slide-reader pre")).toContainText("Lesson 10");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("practice and import/export work without sign-in", async ({ page }) => {
  await go(page, "/vocabulary");
  await page.getByLabel("Search vocabulary").fill("篮球");
  const learn = page.getByRole("button", { name: /Mark .* learned/ }).first();
  await learn.click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Mark .* for review/ }).first(),
  ).toBeVisible();
  await go(page, "/practice");
  await page.getByRole("button", { name: /Find the meaning/ }).click();
  await page.locator(".choices button").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await go(page, "/progress");
  await expect(
    page.getByRole("heading", { name: "Every small step counts." }),
  ).toBeVisible();
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"xp":-5}'),
  });
  await expect(
    page.getByText(
      "Invalid progress backup. Use an exported Chinese Studio JSON file.",
    ),
  ).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  expect((await dl).suggestedFilename()).toBe("chinese-studio-progress.json");
  const valid = {
    known: {},
    wrong: {},
    reviews: {},
    answers: {},
    history: [],
    xp: 42,
    streakDates: [],
    glyphs: {},
  };
  await page.locator("input[type=file]").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await expect(page.getByText("Progress restored.")).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".progress-stats").getByText("42", { exact: true }),
  ).toBeVisible();
});
test("complete pack loads lessons, lazy handwriting and resources offline", async ({
  page,
  context,
  browserName,
}) => {
  test.setTimeout(180000);
  const server = spawn(process.execPath, ["scripts/serve-portable.mjs"], {
    env: {
      ...process.env,
      PORT: "0",
      STUDIO_WEB_ROOT: path.resolve("build/client"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const origin = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Portable server did not start")),
      10000,
    );
    server.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    server.once("error", reject);
  });
  const offlineGo = (url: string) => go(page, origin + url);
  try {
    await offlineGo("/offline");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.getByRole("button", { name: "Download all lessons" }).click();
    await expect(
      page.getByText("All study materials are saved for offline use."),
    ).toBeVisible({ timeout: 150000 });
    await new Promise<void>((resolve) => {
      server.once("exit", () => resolve());
      server.kill();
    });
    await expect(fetch(origin + "/course.json")).rejects.toThrow();
    // WebKit offline emulation blocks cached service-worker requests. The origin
    // is stopped for all engines, so this still verifies a real network outage.
    if (browserName !== "webkit") await context.setOffline(true);
    await offlineGo("/lesson/8");
    await page
      .getByRole("button", { name: "Lesson notes", exact: true })
      .click();
    await expect(page.locator(".slide-reader pre")).toContainText("Lesson 8");
    await offlineGo("/handwriting");
    await expect(
      page.getByRole("button", { name: "Watch", exact: true }),
    ).toBeEnabled();
    const pdf = await page.evaluate(async () => {
      const r = await fetch("/library/resources/Lesson%201.pdf", {
        headers: { Range: "bytes=0-9" },
      });
      return { status: r.status, bytes: (await r.arrayBuffer()).byteLength };
    });
    expect(pdf).toEqual({ status: 206, bytes: 10 });
    await offlineGo("/practice");
    await page.getByRole("button", { name: /Flip & remember/ }).click();
    await expect(page.getByRole("button", { name: /Got it/ })).toBeVisible();
    await context.setOffline(false);
  } finally {
    if (server.exitCode === null) server.kill();
  }
});
