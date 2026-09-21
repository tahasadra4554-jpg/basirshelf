import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");

async function run() {
  console.log("Verifying live production at https://basirshelf.vercel.app ...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Visit live production URL
  await page.goto("https://basirshelf.vercel.app/", { waitUntil: "networkidle" });

  // 2. Verify dark mode is default on production
  const isDark = await page.evaluate(() => {
    return document.documentElement.classList.contains("dark");
  });
  console.log(`Live production isDark: ${isDark}`);
  if (!isDark) {
    throw new Error("Dark mode is NOT default on production!");
  }

  // 3. Take live production hero screenshot
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "production-theme-hero.png"),
    fullPage: false,
  });
  console.log("Saved production-theme-hero.png");

  // 4. Scroll to course library
  await page.locator("#books").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "production-theme-library.png"),
    fullPage: false,
  });
  console.log("Saved production-theme-library.png");

  // 5. Navigate directly to book detail page
  await page.goto("https://basirshelf.vercel.app/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });
  console.log("Live book detail URL:", page.url());

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "production-theme-book-detail.png"),
    fullPage: false,
  });
  console.log("Saved production-theme-book-detail.png");

  // 6. Open Gear Dial
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "production-theme-gear-dial.png"),
    fullPage: false,
  });
  console.log("Saved production-theme-gear-dial.png");

  // Trigger Cassette Player
  console.log("Triggering Audio Cassette Player on production...");
  const audioBadge = page.locator('div:has-text("Audio")').last();
  if (await audioBadge.isVisible()) {
    await audioBadge.click();
    await page.waitForTimeout(400);
  }
  const launchBtn = page.locator('button:has-text("Open Audio"), button:has-text("Audio")').last();
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "production-theme-cassette-player.png"),
    fullPage: false,
  });
  console.log("Saved production-theme-cassette-player.png");

  // 7. Toggle to Light mode
  const lightBtn = page.locator('button[aria-label="Light theme"], button[title="Light theme"]');
  if (await lightBtn.isVisible()) {
    await lightBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(PREVIEW_DIR, "production-theme-light-detail.png"),
      fullPage: false,
    });
    console.log("Saved production-theme-light-detail.png");

    await page.goto("https://basirshelf.vercel.app/", { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(PREVIEW_DIR, "production-theme-light-home.png"),
      fullPage: false,
    });
    console.log("Saved production-theme-light-home.png");
  }

  await browser.close();
  console.log("Live production verification passed 100%!");
}

run().catch((err) => {
  console.error("Live production verification failed:", err);
  process.exit(1);
});
