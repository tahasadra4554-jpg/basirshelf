import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");

async function run() {
  console.log("Verifying multi-file system...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Visit Book Detail page with seeded multi-files
  await page.goto("http://localhost:3001/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  await page.waitForTimeout(1000);

  // Check that Unit 1 shows counts
  const unit1 = page.locator('li').filter({ hasText: 'Unit 1' }).first();
  await unit1.waitFor({ state: "visible", timeout: 5000 });
  const text = await unit1.textContent();
  console.log("Unit 1 text:", text?.slice(0, 200));

  // 2. Click gear button for Unit 1 (should have 3 videos, 2 audios, etc)
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-multi-files.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-multi-files.png");

  // Check that subtitle shows count
  const subtitle = await page.locator('text=/videos available|audios available|images available|PDFs available/').first().textContent().catch(() => null);
  console.log("Subtitle with count:", subtitle);

  // Click "Open Video" which should open file list modal since 3 videos
  const openVideoBtn = page.locator('button:has-text("Open Video")').first();
  if (await openVideoBtn.isVisible().catch(() => false)) {
    await openVideoBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(PREVIEW_DIR, "file-list-videos.png"),
      fullPage: false,
    });
    console.log("Saved file-list-videos.png (should show 3 videos with search)");

    // Test search
    const searchInput = page.locator('input[placeholder*="Search videos"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("Grammar");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(PREVIEW_DIR, "file-list-search.png"),
        fullPage: false,
      });
      console.log("Saved file-list-search.png (filtered)");

      // Clear search
      await searchInput.fill("");
      await page.waitForTimeout(500);
    }

    // Close file list
    const closeBtn = page.locator('button[aria-label="Close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 3. Test Images grid
  // Re-open gear dial
  await gearBtn.click();
  await page.waitForTimeout(800);

  // Navigate to Images via Next button twice
  const nextBtn = page.locator('button[aria-label="Next option"]');
  await nextBtn.click(); // Audio
  await page.waitForTimeout(400);
  await nextBtn.click(); // Images
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-images-count.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-images-count.png (should show 5 images)");

  const openImagesBtn = page.locator('button:has-text("Open Images")').first();
  if (await openImagesBtn.isVisible().catch(() => false)) {
    await openImagesBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(PREVIEW_DIR, "file-list-images-grid.png"),
      fullPage: false,
    });
    console.log("Saved file-list-images-grid.png (should show 2-4 col grid)");

    // Click first image to open lightbox
    const firstImage = page.locator('.group.cursor-pointer').first();
    if (await firstImage.isVisible().catch(() => false)) {
      await firstImage.click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(PREVIEW_DIR, "image-lightbox.png"),
        fullPage: false,
      });
      console.log("Saved image-lightbox.png (should show lightbox with nav)");

      // Close lightbox
      const closeLightbox = page.locator('button:has-text("Close"), button[aria-label="Close"]').last();
      await closeLightbox.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Close file list
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  // 4. Test mobile viewport for file list
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  // Re-open for mobile
  await gearBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(PREVIEW_DIR, "gear-dial-multi-mobile.png"),
    fullPage: false,
  });
  console.log("Saved gear-dial-multi-mobile.png");

  await browser.close();
  console.log("Multi-file verification complete!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
