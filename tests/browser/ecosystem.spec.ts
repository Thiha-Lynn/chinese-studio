import { test, expect, type Page } from "@playwright/test";

async function go(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("#main")).toBeVisible();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("every section has ESC identity and fits in both themes", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "learn",
    "school",
    "vocabulary",
    "practice",
    "oral",
    "handwriting",
    "resources",
    "progress",
    "offline",
    "coverage",
    "privacy",
    "terms",
    "course/1",
  ]) {
    await go(page, "/" + route);
    await expect(page).toHaveTitle(/ESC Chinese/);
    await fits(page);
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(
      page.getByRole("button", { name: "Toggle color theme" }),
    ).toHaveAttribute("aria-pressed", "true");
    await fits(page);
    if (["school", "offline"].includes(route))
      await page.screenshot({
        path: `test-results/${info.project.name}-${route}-dark.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Toggle color theme" }).click();
  }
  expect(errors).toEqual([]);
});

test("all ten lessons expose working sections, slides and saved notes", async ({
  page,
}) => {
  for (let lesson = 1; lesson <= 10; lesson++) {
    await go(page, `/lesson/${lesson}`);
    const group = page.getByRole("group", { name: "Lesson sections" });
    await group
      .getByRole("button", { name: "Start", exact: true })
      .press("ArrowRight");
    await expect(
      group.getByRole("button", { name: "Vocabulary", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const flip = page.getByRole("button", { name: /^Flip / }).first();
    await flip.click();
    await expect(flip).toHaveAttribute("aria-pressed", "true");
    await group
      .getByRole("button", { name: "Lesson notes", exact: true })
      .click();
    await page.getByLabel("Jump to slide").selectOption("1");
    await expect(page.getByLabel("Jump to slide")).toHaveValue("1");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByLabel("Jump to slide")).toHaveValue("0");
    await group
      .getByRole("button", { name: "Practice & test", exact: true })
      .click();
    await expect(page.locator(".mode-card")).toHaveCount(6);
    await group
      .getByRole("button", { name: "Assignments", exact: true })
      .click();
    await page
      .getByLabel(`My Lesson ${lesson} working notes`)
      .fill(`ESC lesson ${lesson} notes`);
    await group.getByRole("button", { name: "Resources", exact: true }).click();
    expect(await page.locator(".resource-row").count()).toBeGreaterThan(1);
    await fits(page);
    await group
      .getByRole("button", { name: "Assignments", exact: true })
      .click();
    await expect(
      page.getByLabel(`My Lesson ${lesson} working notes`),
    ).toHaveValue(`ESC lesson ${lesson} notes`);
  }
  await page.reload();
  await page.getByRole("button", { name: "Assignments", exact: true }).click();
  await expect(page.getByLabel("My Lesson 10 working notes")).toHaveValue(
    "ESC lesson 10 notes",
  );
});

test("practice modes accept answers and record a completed round", async ({
  page,
}) => {
  await go(page, "/practice");
  await page.getByRole("button", { name: /A little refresh/ }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing due right now." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose a practice" }).click();
  for (const mode of [
    "Find the meaning",
    "Listen closely",
    "Type the pinyin",
    "Build a sentence",
  ]) {
    await page.getByRole("button", { name: new RegExp(mode) }).click();
    if (["Find the meaning", "Listen closely"].includes(mode))
      await page.locator(".choices button").first().click();
    else if (mode === "Type the pinyin") {
      await page.getByLabel("Your pinyin answer").fill("test answer");
      await page.getByRole("button", { name: "Check answer" }).click();
    } else {
      const pieces = page.locator(".characters button");
      for (let i = 0; i < (await pieces.count()); i++)
        await pieces.nth(i).click();
      await page.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Check sentence" }),
      ).toBeDisabled();
      for (let i = 0; i < (await pieces.count()); i++)
        await pieces.nth(i).click();
      await page.getByRole("button", { name: "Check sentence" }).click();
    }
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: /Practice playground/ }).click();
  }
  await page.getByRole("button", { name: /Flip & remember/ }).click();
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: "Flip to meaning" }).click();
    await expect(
      page.getByRole("button", { name: "Show Chinese word" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Got it" }).click();
    await page
      .getByRole("button", {
        name: i === 9 ? "See my result" : "Next",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "10 / 10", exact: true }),
  ).toBeVisible();
  await go(page, "/progress");
  await expect(page.locator(".history-row").first()).toContainText("10 / 10");
});

test("oral rehearsal, handwriting, resource viewer and tutor controls", async ({
  page,
}) => {
  await go(page, "/oral");
  await page.locator(".oral-groups summary").first().click();
  await page
    .getByLabel("Make it true for you")
    .first()
    .fill("我喜欢学习汉语。");
  await page.getByRole("button", { name: "Read the words" }).click();
  await expect(page.locator(".reading-grid details")).toHaveCount(30);
  await page.locator(".reading-grid summary").first().click();
  await expect(page.locator(".reading-grid details").first()).toHaveAttribute(
    "open",
    "",
  );
  await page.getByRole("button", { name: "Mock oral test" }).click();
  await page.getByRole("button", { name: "Start rehearsal" }).click();
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: "Reveal help" }).click();
    await expect(
      page.getByRole("button", { name: "Hide help" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: /^Comfortable/ }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Your rehearsal: 15 / 15" }),
  ).toBeVisible();
  await go(page, "/handwriting");
  await expect(
    page.getByRole("button", { name: "Watch", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await page.getByLabel("Show character outline").uncheck();
  await page.getByRole("button", { name: "Your turn" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draw in stroke order" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restart character" }).click();
  await go(page, "/resources");
  await page.getByLabel("Filter resources by lesson").selectOption("1");
  const pdf = page
    .locator(".resource-row")
    .filter({ has: page.locator('a[href$=".pdf"]') })
    .first();
  await pdf.getByRole("button", { name: "Open", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Course resource viewer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close resource" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(
    page.getByRole("button", { name: /Explain this lesson simply/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close AI tutor" }).click();
  await expect(
    page.getByRole("button", { name: "Open AI study tutor" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("installer catalog and mobile keyboard navigation", async ({
  page,
}, info) => {
  await go(page, "/offline");
  for (const suffix of [
    "android.apk",
    "mac-arm64.dmg",
    "mac-x64.dmg",
    "win-x64.exe",
    "win-arm64.exe",
    "linux-x64.deb",
    "linux-arm64.deb",
    "linux-x64.AppImage",
    "linux-arm64.AppImage",
    "portable.zip",
  ]) {
    const link = page.locator(`a[href$="${suffix}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute(
      "href",
      /\/v1\.2\.0\/esc-chinese-1\.2\.0-/,
    );
  }
  if (info.project.name.includes("mobile")) {
    const open = page.getByRole("button", { name: "Open navigation" });
    await open.click();
    await expect(
      page.getByRole("button", { name: "Close navigation" }).first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(open).toBeFocused();
    await open.click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Our school" })
      .click();
    await expect(page).toHaveURL(/\/school$/);
    await expect(open).toHaveAttribute("aria-expanded", "false");
  }
});

test("display preferences persist and a shrinking vocabulary page recovers", async ({
  page,
}) => {
  await go(page, "/vocabulary");
  await page.getByRole("button", { name: "Use immersive visuals" }).click();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Use calm flat visuals" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Filter vocabulary by lesson").selectOption("1");
  await page.getByLabel("Still learning", { exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (let i = 0; i < 8; i++)
    await page
      .getByRole("button", { name: /Mark .* learned/ })
      .first()
      .click();
  await expect(page.locator(".pagination")).toContainText("1 / 1");
  await expect(page.locator(".vocab-card")).toHaveCount(12);
  await go(page, "/progress");
  await page
    .getByRole("button", { name: "Clear device progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep my progress", exact: true })
    .click();
  await page.reload();
  await expect(
    page.locator(".progress-stats").getByText("8", { exact: true }),
  ).toBeVisible();
});

test("install prompt received before visiting install page remains available", async ({
  page,
}) => {
  await go(page, "/learn");
  await page.evaluate(() => {
    const prompt = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      },
    );
    window.dispatchEvent(prompt);
  });
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Offline & install" })
    .click();
  await page.getByRole("button", { name: "Install app", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Installation dismissed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Install app", exact: true }),
  ).toHaveCount(0);
});
