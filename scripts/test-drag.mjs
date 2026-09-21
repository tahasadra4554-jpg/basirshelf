import { chromium } from "playwright";

async function run() {
  console.log("Testing gear drag with pointer events...");
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/books/b0000000-1000-4000-8000-100000000001", { waitUntil: "networkidle", timeout: 30000 });
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 5000 });
  await gearBtn.click();
  await page.waitForTimeout(600);

  // Check initial label
  let label = await page.locator('text=VIDEO SELECTED').first().isVisible().catch(() => false);
  console.log("Initial VIDEO SELECTED visible:", label);

  // Get dial element
  const dial = page.locator('.gear-dial').first();
  await dial.waitFor({ state: "visible" });
  const box = await dial.boundingBox();
  if (!box) throw new Error("No bounding box for dial");

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Simulate drag: pointer down at center, move to the right and down (clockwise rotation)
  // To rotate clockwise, we need to drag from top to right, or use angle calculation
  // We'll drag from point slightly to the right of center, moving down
  console.log(`Dial center: ${centerX}, ${centerY}, box:`, box);

  // Drag test 1: mouse drag
  await page.mouse.move(centerX + 80, centerY);
  await page.mouse.down();
  await page.waitForTimeout(100);
  // Move in an arc to simulate rotation
  await page.mouse.move(centerX + 60, centerY + 60, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.move(centerX, centerY + 80, { steps: 10 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(800);

  // Check if selection changed from VIDEO
  const audioVisible = await page.locator('text=AUDIO SELECTED').first().isVisible().catch(() => false);
  const videoVisible = await page.locator('text=VIDEO SELECTED').first().isVisible().catch(() => false);
  console.log("After drag - AUDIO SELECTED visible:", audioVisible, "VIDEO still visible:", videoVisible);

  // Try second drag
  await page.mouse.move(centerX + 80, centerY);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(centerX - 80, centerY, { steps: 15 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(800);

  const afterSecond = await page.locator('text=/SELECTED/').first().textContent();
  console.log("After second drag, selected text:", afterSecond);

  // Test touch drag via pointer events
  const dialEl = await page.$('.gear-dial');
  // Use page.dispatchEvent with pointer events
  await page.evaluate(({ cx, cy }) => {
    const el = document.querySelector('[role="slider"]');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    // Simulate pointerdown at angle 0
    const downEvent = new PointerEvent('pointerdown', {
      clientX: centerX + 80,
      clientY: centerY,
      pointerId: 1,
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
    });
    el.dispatchEvent(downEvent);
    return true;
  }, { cx: centerX, cy: centerY });

  console.log("Pointer event dispatch test done");

  await browser.close();
  console.log("Drag test completed successfully!");
}

run().catch(e => { console.error(e); process.exit(1); });
