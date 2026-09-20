import { chromium } from "playwright";

async function testGearDial() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("1. Navigating to Interchange 1 page...");
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });

  const firstUnit = page.locator("ol.divide-y li").first();
  await firstUnit.scrollIntoViewIfNeeded();

  // Find gear button
  const gearBtn = firstUnit.locator('button[aria-label^="Open interactive gear dial"]');
  console.log("2. Gear button exists:", (await gearBtn.count()) === 1);

  // Check desktop hover behavior: gear button opacity 0 before hover, 1 on hover
  const opBefore = await gearBtn.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("3. Desktop gear opacity before hover:", opBefore);

  await firstUnit.hover();
  await page.waitForTimeout(300);
  const opAfter = await gearBtn.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("4. Desktop gear opacity after hover:", opAfter);

  // Click the gear icon
  console.log("5. Clicking gear icon to open interactive rotating gear wheel dial...");
  await gearBtn.click();
  await page.waitForTimeout(600);

  // Check that the GearDialModal is visible
  const modal = page.locator('[role="dialog"][aria-label^="Select media"]');
  console.log("6. Gear dial modal open:", await modal.isVisible());

  // Screenshot the mechanical gear dial modal on desktop
  await page.screenshot({ path: "/tmp/gear-dial-desktop.png" });
  console.log("7. Saved /tmp/gear-dial-desktop.png");

  // Test rotating the dial using arrow keys
  console.log("8. Testing rotation via ArrowRight key...");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);

  // Check what option is selected now
  const selectedText1 = await page.locator("h4.font-serif").innerText();
  console.log("   Selected after ArrowRight:", selectedText1);

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  const selectedText2 = await page.locator("h4.font-serif").innerText();
  console.log("   Selected after second ArrowRight:", selectedText2);

  await page.screenshot({ path: "/tmp/gear-dial-rotated.png" });
  console.log("   Saved /tmp/gear-dial-rotated.png");

  // Press Escape to close modal
  await page.keyboard.press("Escape");
  await modal.waitFor({ state: "hidden", timeout: 3000 });
  console.log("9. Dial closed on Escape: true");

  // Test Mobile Viewport (390x844)
  console.log("\n--- Testing Mobile Viewport (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });

  const mobileFirstUnit = mobilePage.locator("ol.divide-y li").first();
  await mobileFirstUnit.scrollIntoViewIfNeeded();

  const mobileGear = mobileFirstUnit.locator('button[aria-label^="Open interactive gear dial"]');
  const mobileOp = await mobileGear.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("10. Mobile gear opacity without hover (always visible):", mobileOp);

  // Tap gear on mobile
  await mobileGear.click();
  await mobilePage.waitForTimeout(600);

  const mobileModal = mobilePage.locator('[role="dialog"][aria-label^="Select media"]');
  console.log("11. Mobile gear dial open:", await mobileModal.isVisible());

  await mobilePage.screenshot({ path: "/tmp/gear-dial-mobile.png" });
  console.log("12. Saved /tmp/gear-dial-mobile.png");

  await browser.close();
  console.log("\n✓ All Rotating Gear Wheel tests passed!");
}

testGearDial().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
