import { chromium } from "playwright";
import path from "path";

const PREVIEW_DIR = path.resolve(process.cwd(), "public/previews");

async function run() {
  console.log("Checking PRODUCTION site https://basirshelf.vercel.app ...");
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("https://basirshelf.vercel.app/books/b0000000-1000-4000-8000-100000000001", { waitUntil: "networkidle", timeout: 30000 });
  const gearBtn = page.locator('button[aria-label*="gear dial"]').first();
  await gearBtn.waitFor({ state: "visible", timeout: 10000 });
  await gearBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(PREVIEW_DIR, "gear-dial-production-check.png"), fullPage: false });
  console.log("Saved production screenshot to gear-dial-production-check.png");
  
  // Check for colored badges
  const hasRed = await page.locator('text=VIDEO SELECTED').first().isVisible().catch(()=>false);
  console.log("VIDEO SELECTED visible on prod:", hasRed);
  
  // Check center hub position via JS
  const hubInfo = await page.evaluate(() => {
    const hub = document.querySelector('.gear-dial [style*="translate(-50%, -50%)"]');
    if (!hub) return null;
    const rect = hub.getBoundingClientRect();
    const gear = document.querySelector('.gear-dial');
    const gearRect = gear?.getBoundingClientRect();
    return { hubRect: rect, gearRect, top: hub.style.top, left: hub.style.left, transform: hub.style.transform };
  });
  console.log("Hub info:", hubInfo);
  
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
