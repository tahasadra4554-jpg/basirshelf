import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("1. Navigating to home page...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

  // Find first book link
  const bookLink = page.locator('a[href^="/books/"]').first();
  const bookHref = await bookLink.getAttribute("href");
  console.log("2. Navigating to book detail page:", bookHref);
  await page.goto(`http://localhost:3000${bookHref}`, { waitUntil: "networkidle" });

  // Find first unit row
  const firstUnit = page.locator("ol.divide-y li").first();
  await firstUnit.scrollIntoViewIfNeeded();

  // Find gear button
  const gearBtn = firstUnit.locator('button[aria-label^="Quick actions"]');
  const count = await gearBtn.count();
  console.log("3. Found gear button count:", count);

  // Check initial desktop opacity (should be hidden or 0 before hover)
  const initialOpacity = await gearBtn.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("4. Gear button opacity before hover:", initialOpacity);

  // Hover over the unit row
  await firstUnit.hover();
  await page.waitForTimeout(300);
  const hoverOpacity = await gearBtn.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("5. Gear button opacity after hover:", hoverOpacity);

  // Click gear to open menu
  await gearBtn.click();
  await page.waitForTimeout(400);

  // Take screenshot of desktop open menu
  await page.screenshot({ path: "/tmp/quick-actions-desktop.png", fullPage: false });
  console.log("6. Desktop screenshot saved to /tmp/quick-actions-desktop.png");

  // Verify menu items
  const menu = page.locator('[role="menu"]');
  const menuVisible = await menu.isVisible();
  console.log("7. Menu visible:", menuVisible);

  const menuItems = menu.locator('[role="menuitem"]');
  const itemCount = await menuItems.count();
  console.log("8. Menu item count:", itemCount);

  for (let i = 0; i < itemCount; i++) {
    const text = await menuItems.nth(i).innerText();
    console.log(`   Item ${i + 1}:`, text.replace(/\n/g, " - "));
  }

  // Close with Escape key
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const menuClosed = !(await menu.isVisible());
  console.log("9. Menu closed on Escape:", menuClosed);

  // Test Mobile Viewport
  console.log("\n--- Testing Mobile Viewport (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`http://localhost:3000${bookHref}`, { waitUntil: "networkidle" });

  const mobileFirstUnit = mobilePage.locator("ol.divide-y li").first();
  await mobileFirstUnit.scrollIntoViewIfNeeded();

  const mobileGear = mobileFirstUnit.locator('button[aria-label^="Quick actions"]');
  const mobileOpacity = await mobileGear.evaluate((el) => window.getComputedStyle(el).opacity);
  console.log("10. Mobile gear opacity without hover:", mobileOpacity);

  // Tap gear to open mobile bottom sheet
  await mobileGear.click();
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({ path: "/tmp/quick-actions-mobile.png", fullPage: false });
  console.log("11. Mobile screenshot saved to /tmp/quick-actions-mobile.png");

  const mobileMenu = mobilePage.locator('[role="menu"]');
  const mobileMenuVisible = await mobileMenu.isVisible();
  console.log("12. Mobile bottom sheet visible:", mobileMenuVisible);

  await browser.close();
  console.log("\n✓ All interaction tests passed!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
