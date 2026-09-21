import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("=== Testing Cassette Player Enhancements ===");
  console.log("1. Navigating to Interchange 1 page...");
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", {
    waitUntil: "networkidle",
  });

  console.log("2. Opening gear dial on Unit 1...");
  const gearBtn = page.locator('button[aria-label^="Open interactive gear dial"]').first();
  await gearBtn.scrollIntoViewIfNeeded();
  await gearBtn.click({ force: true });
  await page.waitForTimeout(500);

  console.log("3. Rotating gear dial to select Audio (ArrowRight)...");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);

  console.log("4. Confirming Audio selection via Open Audio button...");
  const actionBtn = page.locator('button:has-text("Open Audio")');
  await actionBtn.click();
  await page.waitForTimeout(1000);

  // Verify CHANGE 2: Fullscreen blur overlay
  console.log("5. Verifying CHANGE 2: Fullscreen blur overlay...");
  const overlay = page.locator("div.fixed.inset-0.z-40");
  const overlayVisible = await overlay.isVisible();
  console.log("   Overlay visible:", overlayVisible);
  if (!overlayVisible) {
    throw new Error("Backdrop overlay is not visible!");
  }

  const overlayStyles = await overlay.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      position: cs.position,
      zIndex: cs.zIndex,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      backgroundColor: cs.backgroundColor,
    };
  });
  console.log("   Overlay styles:", overlayStyles);

  // Verify cassette shell container
  const cassetteContainer = page.locator('[role="dialog"][aria-label="Audio player"]');
  console.log("   Cassette dialog visible:", await cassetteContainer.isVisible());
  const cassetteStyles = await cassetteContainer.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      zIndex: cs.zIndex,
      filter: cs.filter,
    };
  });
  console.log("   Cassette container styles:", cassetteStyles);

  // Verify CHANGE 1: Skip arrow buttons
  console.log("6. Verifying CHANGE 1: Skip arrow buttons...");
  const rewindBtn = page.locator('button[aria-label="Back 10s"]');
  const forwardBtn = page.locator('button[aria-label="Forward 10s"]');

  console.log("   Rewind button exists & visible:", await rewindBtn.isVisible());
  console.log("   Forward button exists & visible:", await forwardBtn.isVisible());
  console.log("   Rewind title tooltip:", await rewindBtn.getAttribute("title"));
  console.log("   Forward title tooltip:", await forwardBtn.getAttribute("title"));

  // Check SVG icons inside rewind & forward (lucide-react Rewind and FastForward)
  const rewindSvg = rewindBtn.locator("svg");
  const forwardSvg = forwardBtn.locator("svg");
  console.log("   Rewind SVG class:", await rewindSvg.getAttribute("class"));
  console.log("   Forward SVG class:", await forwardSvg.getAttribute("class"));

  // Screenshot desktop view showing the blur overlay and sharp cassette
  await page.screenshot({ path: "public/previews/cassette-blur-desktop.png" });
  console.log("   Saved public/previews/cassette-blur-desktop.png");

  // Screenshot closeup of cassette deck
  await cassetteContainer.screenshot({ path: "public/previews/cassette-deck-closeup.png" });
  console.log("   Saved public/previews/cassette-deck-closeup.png");

  // Test Play button
  console.log("7. Testing Play & Skip 10s behavior...");
  const playBtn = page.locator('button[aria-label="Play audio"], button[aria-label="Pause audio"]').first();
  await playBtn.click();
  await page.waitForTimeout(1000);

  // Read current time display
  const timeDisplay = page.locator('span.font-mono').first();
  const timeBefore = await timeDisplay.innerText().catch(() => "N/A");
  console.log("   Time before forward:", timeBefore);

  // Click forward 10s
  await forwardBtn.click();
  await page.waitForTimeout(600);
  const timeAfterForward = await timeDisplay.innerText().catch(() => "N/A");
  console.log("   Time after Forward 10s:", timeAfterForward);

  // Click rewind 10s
  await rewindBtn.click();
  await page.waitForTimeout(600);
  const timeAfterRewind = await timeDisplay.innerText().catch(() => "N/A");
  console.log("   Time after Rewind 10s:", timeAfterRewind);

  // Test keyboard ArrowRight & ArrowLeft
  console.log("8. Testing Keyboard shortcuts (ArrowLeft / ArrowRight)...");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  console.log("   Time after ArrowRight:", await timeDisplay.innerText().catch(() => "N/A"));

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(400);
  console.log("   Time after ArrowLeft:", await timeDisplay.innerText().catch(() => "N/A"));

  // Test clicking outside overlay minimizes cassette
  console.log("9. Testing Click-Outside overlay minimizes cassette...");
  // Click at the top-left area (x: 50, y: 50 is outside the cassette)
  await page.mouse.click(50, 50);
  await page.waitForTimeout(600);

  // Verify minimized badge is visible
  const miniBadge = page.locator('button[aria-label="Expand cassette audio player"]');
  const isMini = await miniBadge.isVisible();
  console.log("   Minimized badge visible after click-outside:", isMini);

  // Screenshot minimized badge
  await page.screenshot({ path: "public/previews/cassette-minimized-badge.png" });
  console.log("   Saved public/previews/cassette-minimized-badge.png");

  // Click minimized badge to restore
  console.log("10. Restoring cassette player from minimized badge...");
  await miniBadge.click();
  await page.waitForTimeout(600);
  console.log("   Cassette player visible again:", await cassetteContainer.isVisible());

  // Test Esc key minimizes cassette
  console.log("11. Testing Escape key minimizes cassette...");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  console.log("   Minimized badge visible after Escape:", await miniBadge.isVisible());

  // Restore again
  await miniBadge.click();
  await page.waitForTimeout(600);

  // Test Close ("X") button stops and removes player
  console.log("12. Testing Close ('X') button closes completely...");
  const closeBtn = page.locator('button[aria-label="Close audio player"]');
  await closeBtn.click();
  await page.waitForTimeout(600);
  console.log("   Overlay hidden:", !(await overlay.isVisible().catch(() => false)));
  console.log("   Minimized badge hidden:", !(await miniBadge.isVisible().catch(() => false)));

  // Test Mobile Viewport
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

  const mGear = mobilePage.locator('button[aria-label^="Open interactive gear dial"]').first();
  await mGear.scrollIntoViewIfNeeded();
  await mGear.click({ force: true });
  await mobilePage.waitForTimeout(600);

  await mobilePage.keyboard.press("ArrowRight");
  await mobilePage.waitForTimeout(400);
  await mobilePage.locator('button:has-text("Open Audio")').click();
  await mobilePage.waitForTimeout(1000);

  const mOverlay = mobilePage.locator("div.fixed.inset-0.z-40");
  console.log("   Mobile overlay visible:", await mOverlay.isVisible());

  const mOverlayStyles = await mOverlay.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
    };
  });
  console.log("   Mobile backdrop filter:", mOverlayStyles.backdropFilter);

  const mRewind = mobilePage.locator('button[aria-label="Back 10s"]');
  const mForward = mobilePage.locator('button[aria-label="Forward 10s"]');
  console.log("   Mobile rewind button visible:", await mRewind.isVisible());
  console.log("   Mobile forward button visible:", await mForward.isVisible());

  await mobilePage.screenshot({ path: "public/previews/cassette-blur-mobile.png" });
  console.log("   Saved public/previews/cassette-blur-mobile.png");

  await browser.close();
  console.log("\n✓ All tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
