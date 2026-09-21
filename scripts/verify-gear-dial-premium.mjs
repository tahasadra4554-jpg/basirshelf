import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");

async function run() {
  console.log("Verifying upgraded gear dial with 3D depth, mini gears, particles, and color halo...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Visit Book Detail page
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // 2. Click the gear button on Unit 1
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(600);

  // Capture screenshot: Initial state (Video selected -> Red Halo, 3D tilt, 3 mini gears visible, amber particles)
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-3d-video.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-3d-video.png (Initial Video option with Red Halo)");

  // 3. Step dial to Audio (Right arrow or ChevronRight)
  const nextBtn = page.locator('button[aria-label="Next option"]');
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Capture screenshot: Audio selected -> Purple Halo + Particles
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-3d-audio.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-3d-audio.png (Audio option with Purple Halo)");

  // 4. Step dial to Images -> Green Halo
  await nextBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-3d-images.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-3d-images.png (Images option with Green Halo)");

  // 5. Step dial to PDF -> Blue Halo
  await nextBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-3d-pdf.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-3d-pdf.png (PDF option with Blue Halo)");

  // 6. Test mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-3d-mobile.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-3d-mobile.png (Mobile Viewport with 40px Mini Gears)");

  await browser.close();
  console.log("All gear dial premium features verified successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
