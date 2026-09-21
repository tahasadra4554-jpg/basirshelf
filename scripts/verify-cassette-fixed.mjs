import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");

async function run() {
  console.log("Verifying fixed cassette player against http://localhost:3000 ...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Visit book detail page in default dark mode
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });

  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  console.log(`Default isDark: ${isDark}`);

  // 2. Open Gear Dial
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(600);

  // 3. Trigger Audio Cassette Player
  const audioOption = page.locator('button:has-text("Audio lesson"), div:has-text("Audio lesson"), div:has-text("Audio")').last();
  if (await audioOption.isVisible()) {
    await audioOption.click();
    await page.waitForTimeout(400);
  }
  const launchBtn = page.locator('button:has-text("Open Audio"), button:has-text("Audio")').last();
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
    await page.waitForTimeout(800);
  }

  // 4. Capture screenshot of cassette in Dark Mode
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "cassette-fixed-dark-mode.png"),
    fullPage: false,
  });
  console.log("Saved cassette-fixed-dark-mode.png");

  // 5. Switch to Light Mode while cassette is open
  console.log("Switching to light mode while cassette player is open...");
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("basirshelf:theme", "light");
  });
  await page.waitForTimeout(600);

  // 6. Capture screenshot of cassette in Light Mode
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "cassette-fixed-light-mode.png"),
    fullPage: false,
  });
  console.log("Saved cassette-fixed-light-mode.png");

  await browser.close();
  console.log("Cassette fixed color verification complete!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
