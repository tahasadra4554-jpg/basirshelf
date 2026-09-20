import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const TAG = process.argv[3] ?? "local";

const views = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  // trigger lazy covers, then wait for them all to finish decoding
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img[src*='/covers/']")];
    await Promise.all(
      imgs.map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => (img.onload = img.onerror = r)),
      ),
    );
  });
  const report = await page.evaluate(() => {
    return [...document.querySelectorAll("img[src*='/covers/']")].map((img) => {
      const cs = getComputedStyle(img);
      const box = img.getBoundingClientRect();
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(box.width / iw, box.height / ih);
      const fit = cs.objectFit;
      const hCrop = fit === "cover" ? Math.max(0, 1 - box.width / (iw * scale)) : 0;
      const vCrop = fit === "cover" ? Math.max(0, 1 - box.height / (ih * scale)) : 0;
      return {
        src: img.src.split("/covers/")[1],
        fit,
        pos: cs.objectPosition,
        box: `${Math.round(box.width)}x${Math.round(box.height)}`,
        natural: `${iw}x${ih}`,
        vCropPct: (vCrop * 100).toFixed(1),
        hCropPct: (hCrop * 100).toFixed(1),
      };
    });
  });
  console.log(`\n=== ${v.name} (${v.width}px) ===`);
  for (const r of report)
    console.log(
      `  ${r.src}  box=${r.box}  natural=${r.natural}  fit=${r.fit} pos=${r.pos}  cropped v=${r.vCropPct}% h=${r.hCropPct}%`,
    );
  await page.screenshot({ path: `/tmp/home-${TAG}-${v.name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log(`\nscreenshots: /tmp/home-${TAG}-desktop.png /tmp/home-${TAG}-mobile.png`);
