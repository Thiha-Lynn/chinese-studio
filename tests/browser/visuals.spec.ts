import { test, expect } from "@playwright/test";

test("all 249 vocabulary cards have bounded artwork and full-width flip controls", async ({
  page,
}, info) => {
  // Assert the actual SPA content below; Firefox's load event can remain
  // pending after a large offline-cache test even when the reader is ready.
  await page.goto("/vocabulary", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".vocab-card").first()).toBeVisible();
  let count = 0;
  do {
    const cards = page.locator(".vocab-card");
    count += await cards.count();
    const dimensions = await cards.evaluateAll((elements) =>
      elements.map((card) => {
        const button = card.querySelector(".mini-flip")!;
        const face = card.querySelector(".mini-front")!;
        const back = card.querySelector(".mini-back")!;
        const art = card.querySelector(".word-artwork")!;
        const b = button.getBoundingClientRect(),
          c = card.getBoundingClientRect(),
          a = art.getBoundingClientRect();
        return {
          word: card.textContent,
          faceWidth: face.clientWidth,
          faceHeight: face.clientHeight,
          scrollWidth: face.scrollWidth,
          scrollHeight: face.scrollHeight,
          width: b.width,
          cardWidth: c.width,
          height: b.height,
          artWidth: a.width,
          artHeight: a.height,
          backOverflow:
            back.scrollWidth > back.clientWidth ||
            back.scrollHeight > back.clientHeight,
          overflow:
            face.scrollWidth > face.clientWidth ||
            face.scrollHeight > face.clientHeight,
        };
      }),
    );
    for (const d of dimensions) {
      expect(Math.abs(d.width - d.cardWidth)).toBeLessThanOrEqual(3);
      expect(d.height).toBeGreaterThanOrEqual(280);
      expect(d.height).toBeLessThanOrEqual(340);
      expect(d.artWidth).toBeGreaterThan(100);
      expect(d.artWidth).toBeLessThanOrEqual(d.width);
      expect(d.artHeight).toBe(156);
      expect(d.overflow, JSON.stringify(d)).toBe(false);
      expect(d.backOverflow, JSON.stringify(d)).toBe(false);
    }
    const flip = cards.first().locator(".mini-flip");
    await flip.click();
    await expect(cards.first().locator(".mini-back")).toBeVisible();
    await expect(cards.first().locator(".mini-front")).toBeHidden();
    await flip.press("Enter");
    await expect(cards.first().locator(".mini-front")).toBeVisible();
    if (
      await page.getByRole("button", { name: "Next", exact: true }).isDisabled()
    )
      break;
    await page.getByRole("button", { name: "Next", exact: true }).click();
  } while (count < 260);
  expect(count).toBe(249);
  await page.getByLabel("Filter vocabulary by lesson").selectOption("9");
  await page.locator(".vocab-card").first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${info.project.name}-character-cards.png`,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator(".character-art").first()).toBeVisible();
  await expect(page.locator(".mini-flip").first()).toHaveCSS(
    "background-color",
    "rgb(18, 35, 58)",
  );
  await page.locator(".vocab-card").first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${info.project.name}-character-cards-dark.png`,
  });
});

test.describe("network image failure", () => {
  // Failure injection must reach the network instead of a service-worker cache.
  test.use({ serviceWorkers: "block" });
  test("unavailable illustrations become readable character cards in vocabulary and practice", async ({
    page,
  }, info) => {
    await page.route("**/library/assets/L1_VOCAB*", (route) =>
      route.fulfill({ status: 404, body: "Not found" }),
    );
    await page.goto("/lesson/1");
    await page
      .getByRole("group", { name: "Lesson sections" })
      .getByRole("button", { name: "Vocabulary", exact: true })
      .click();
    const first = page.locator(".vocab-card").first();
    await first.scrollIntoViewIfNeeded();
    await expect(first.locator(".character-art")).toBeVisible();
    await expect(first.locator("img")).toHaveCount(0);
    await expect(first.locator(".character-art-text")).toHaveText("但是");
    await first.getByRole("button", { name: "Flip 但是", exact: true }).click();
    await expect(first.locator(".mini-back")).toContainText("but");
    await page.goto("/practice");
    await page.getByLabel("Today’s lesson").selectOption("1");
    await page.getByRole("button", { name: /Flip & remember/ }).click();
    await page.locator(".flip-card").scrollIntoViewIfNeeded();
    await expect(page.locator(".flip-front .character-art")).toBeVisible();
    await expect(page.locator(".flip-front img")).toHaveCount(0);
    await page.screenshot({
      path: `test-results/${info.project.name}-practice-art-fallback.png`,
    });
  });
});

test("every packaged image including summary sheets and icons decodes", async ({
  page,
}) => {
  await page.goto("/learn");
  const manifest = await (
    await page.request.get("/offline-manifest.json")
  ).json();
  const urls = [
    ...new Set<string>([
      ...manifest.core,
      ...manifest.files.map((file: { url: string }) => file.url),
    ]),
  ].filter((url) => /\.(png|webp|svg|jpe?g)$/i.test(url));
  expect(urls.length).toBeGreaterThan(150);
  const failed = await page.evaluate(async (paths) => {
    const bad: string[] = [];
    for (let start = 0; start < paths.length; start += 10) {
      await Promise.all(
        paths.slice(start, start + 10).map(async (src) => {
          const image = new Image();
          image.src = src;
          try {
            await image.decode();
            if (!image.naturalWidth) bad.push(src);
          } catch {
            bad.push(src);
          }
        }),
      );
    }
    return bad;
  }, urls);
  expect(failed).toEqual([]);
});
