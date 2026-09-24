import { test, expect } from "@playwright/test";
test("Chinese 1 search, original activity scoring, persistence and independent practice", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/course/1");
  await expect(
    page.getByRole("button", { name: "Explore lesson →" }),
  ).toHaveCount(10);
  await page
    .getByLabel("Search Chinese 1")
    .fill("Match the sound with the correct initials.");
  await page.getByRole("button", { name: /IAM05-1$/ }).click();
  await expect(page.locator(".c1-question audio")).toHaveCount(1);
  await page.getByRole("radio", { name: "C m", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Correct according to the archived source key."),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Mark this page studied" }).check();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Mark this page studied" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(
    page.getByRole("option", { name: "All Chinese 1 lessons" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: /Flip & remember/ }).click();
  await expect(
    page.getByRole("button", { name: "Flip to meaning" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resources", exact: true }).click();
  await expect(page.locator(".c1-resource-list .panel")).toHaveCount(7);
  await page.getByRole("button", { name: "Coverage", exact: true }).click();
  await expect(page.getByText(/1215 of 1216/)).toBeVisible();
  expect(errors).toEqual([]);
});
test("Chinese 1 source sentence order and multilingual story fit the screen", async ({
  page,
}) => {
  await page.goto("/course/1?page=IAM08-1");
  for (const name of ["B 她", "A 是", "C 谁", "D ？"])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Correct according to the archived source key."),
  ).toBeVisible();
  await page.goto("/course/1?page=CTT02-1");
  await page.getByLabel("Source language").selectOption("TH");
  await expect(
    page.getByText("ที่นี่ที่ไหนกัน", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("这里是什么地方？", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/course/1?page=CTA01-183");
  await expect(
    page.getByRole("heading", { name: "Source page unavailable" }),
  ).toBeVisible();
});

test("Chinese 1 video uses a full-width playable source", async ({ page }) => {
  await page.goto("/course/1?page=CTV01-1");
  const video = page.locator(".c1-reader video");
  await expect(video).toBeVisible();
  await video.evaluate((el: HTMLVideoElement) => {
    el.preload = "metadata";
    el.load();
  });
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState))
    .toBeGreaterThan(0);
  expect(
    await video.evaluate((el: HTMLVideoElement) => el.duration),
  ).toBeGreaterThan(0);
  const box = await video.boundingBox();
  expect(box!.width).toBeGreaterThan(200);
});

test("learning home exposes all ten Chinese 1 lessons beside Chinese 2", async ({
  page,
}) => {
  await page.goto("/learn", { waitUntil: "commit" });
  await expect(
    page.getByRole("navigation", { name: "Choose a course" }),
  ).toBeVisible();
  const course1 = page.getByRole("region", { name: "Your Chinese 1 lessons" });
  await expect(course1.locator(".world-card")).toHaveCount(10);
  await expect(page.locator(".world-card")).toHaveCount(20);
  for (let n = 1; n <= 10; n++) {
    await expect(course1.locator(".world-card").nth(n - 1)).toHaveAttribute(
      "href",
      `/course/1?page=HP02-${n}`,
    );
  }
  await course1.locator(".world-card").first().click();
  await expect(
    page.getByRole("heading", { name: "Lesson 1 New Master", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chapter 1 Master An an" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
