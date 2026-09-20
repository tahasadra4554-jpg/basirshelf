import { chromium } from "playwright";

async function checkTeacher() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log("Navigating to teacher login...");
  await page.goto("http://localhost:3000/teacher-login", { waitUntil: "networkidle" });

  await page.fill('input[name="username"]', "teacher1_hamid");
  await page.fill('input[name="password"]', "Xk9mP2qL7w");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  console.log("Current URL:", page.url());

  // Click on "Add unit"
  const addBtn = page.getByRole("button", { name: "Add unit" }).first();
  await addBtn.waitFor({ state: "visible", timeout: 5000 });
  await addBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: "/tmp/teacher-add-section.png" });
  console.log("Saved /tmp/teacher-add-section.png");

  // Verify the new fields exist
  const audioInput = page.locator('input#section-audio-url');
  const imagesInput = page.locator('input#section-images-url');

  console.log("Audio URL input visible:", await audioInput.isVisible());
  console.log("Images URL input visible:", await imagesInput.isVisible());

  await browser.close();
}

checkTeacher().catch(console.error);
