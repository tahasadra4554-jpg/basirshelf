import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

async function run() {
  console.log("Launching browser for visual verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Visit homepage
  console.log("Visiting http://localhost:3000/ ...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

  // 2. Verify dark mode default
  const isDark = await page.evaluate(() => {
    return document.documentElement.classList.contains("dark");
  });
  console.log(`Default theme is dark: ${isDark}`);
  if (!isDark) {
    throw new Error("Dark mode was NOT default on first load!");
  }

  // Check hero section colors
  const heroData = await page.evaluate(() => {
    const heading = document.getElementById("hero-heading");
    const spanAmber = heading?.querySelector("span");
    const desc = heading?.nextElementSibling;
    return {
      headingText: heading?.textContent?.trim(),
      spanAmberColor: spanAmber ? window.getComputedStyle(spanAmber).color : null,
      descColor: desc ? window.getComputedStyle(desc).color : null,
    };
  });
  console.log("Hero evaluation:", heroData);

  // Take screenshot of Dark Mode Homepage Hero
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "01-dark-mode-hero.png"),
    fullPage: false,
  });
  console.log("Saved 01-dark-mode-hero.png");

  // Scroll to course library & take screenshot
  await page.locator("#books").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "02-dark-mode-library-cards.png"),
    fullPage: false,
  });
  console.log("Saved 02-dark-mode-library-cards.png");

  // Scroll to "Why students trust us" & "How it works"
  await page.locator("#why-basir").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "03-dark-mode-trust-and-steps.png"),
    fullPage: false,
  });
  console.log("Saved 03-dark-mode-trust-and-steps.png");

  // 4. Navigate directly to Book Detail Page
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });
  console.log("Navigated to book detail page:", page.url());

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "04-dark-mode-book-detail.png"),
    fullPage: false,
  });
  console.log("Saved 04-dark-mode-book-detail.png");

  // 5. Open Gear Dial
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  console.log("Looking for gear dial button...");
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "05-dark-mode-gear-dial.png"),
    fullPage: false,
  });
  console.log("Saved 05-dark-mode-gear-dial.png");

  // Select Audio option to trigger Cassette Player
  // In the dial modal, click the Audio badge or rotate
  console.log("Triggering Audio Cassette Player from Gear Dial...");
  const audioBadge = page.locator('div:has-text("Audio")').last();
  if (await audioBadge.isVisible()) {
    await audioBadge.click();
    await page.waitForTimeout(400);
  }
  // Click Launch button in dial modal
  const launchBtn = page.locator('button:has-text("Open Audio"), button:has-text("Audio")').last();
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "05b-dark-mode-cassette-player.png"),
    fullPage: false,
  });
  console.log("Saved 05b-dark-mode-cassette-player.png");

  // 6. Test Light Mode Toggle
  console.log("Testing Light Mode toggle...");
  const lightBtn = page.locator('button[aria-label="Light theme"], button[title="Light theme"]');
  if (await lightBtn.isVisible()) {
    await lightBtn.click();
    await page.waitForTimeout(500);

    const isLight = await page.evaluate(() => {
      return !document.documentElement.classList.contains("dark");
    });
    console.log(`Switched to light mode: ${isLight}`);

    await page.screenshot({
      path: path.join(PREVIEW_DIR, "06-light-mode-book-detail.png"),
      fullPage: false,
    });
    console.log("Saved 06-light-mode-book-detail.png");

    // Visit home in light mode
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(PREVIEW_DIR, "07-light-mode-homepage.png"),
      fullPage: false,
    });
    console.log("Saved 07-light-mode-homepage.png");

    // Switch back to Dark Mode
    const darkBtn = page.locator('button[aria-label="Dark theme"], button[title="Dark theme"]');
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(500);
      console.log("Switched back to Dark Mode.");
    }
  }

  // 7. Test Auth Pages
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "08-dark-mode-login.png"),
    fullPage: false,
  });
  console.log("Saved 08-dark-mode-login.png");

  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "09-dark-mode-signup.png"),
    fullPage: false,
  });
  console.log("Saved 09-dark-mode-signup.png");

  await browser.close();
  console.log("All verifications completed successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
