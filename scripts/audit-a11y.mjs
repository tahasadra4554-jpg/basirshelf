#!/usr/bin/env node
/**
 * WCAG 2.1 AA contrast audit for the BasirShelf palette.
 *
 * It reads the real token values straight out of src/app/globals.css (:root and
 * .dark blocks) so the numbers can never drift from what actually ships, then
 * checks every foreground/background pair the UI uses.
 *
 * Usage:  npm run audit:a11y   (exits non-zero when a pair is under 4.5:1)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

/** Pull `--name: #hex;` pairs out of one CSS block. */
function parseBlock(selector) {
  // Anchor on a line-leading selector: ".dark" would otherwise match the
  // "@custom-variant dark (&:where(.dark, .dark *));" declaration first.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = new RegExp(`^${escaped}\\s*\\{`, "m").exec(css);
  if (!found) throw new Error(`Selector not found: ${selector}`);
  const open = found.index + found[0].length - 1;
  const close = css.indexOf("\n}", open);
  const body = css.slice(open, close);
  const tokens = {};
  for (const match of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[match[1]] = match[2].toLowerCase();
  }
  return tokens;
}

function toRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function channel(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const light = parseBlock(":root");
const dark = parseBlock(".dark");

/**
 * Every pair below is rendered somewhere in the UI. `min` is 4.5 for normal
 * text (WCAG 2.1 AA, 1.4.3); 3 is used only for large text (>= 24px / 19px bold,
 * clause 1.4.3 exempts those) and for UI component borders (1.4.11).
 */
const PAIRS = {
  light: [
    ["Body text on cream", "foreground", "background", 4.5],
    ["Heading ink on cream", "navy", "background", 4.5],
    ["Muted copy on cream", "muted-foreground", "background", 4.5],
    ["Soft ink on cream", "ink-soft", "background", 4.5],
    ["Body text on card", "card-foreground", "card", 4.5],
    ["Muted copy on card", "muted-foreground", "card", 4.5],
    ["Body text on hover wash", "foreground", "accent", 4.5],
    ["Navy label on hover wash", "accent-foreground", "accent", 4.5],
    ["Navy label on secondary", "secondary-foreground", "secondary", 4.5],
    ["Muted copy on secondary", "muted-foreground", "secondary", 4.5],
    ["Muted copy on muted", "muted-foreground", "muted", 4.5],
    ["Cream on navy surface", "navy-foreground", "navy", 4.5],
    ["Indigo text on cream", "indigo-text", "background", 4.5],
    ["Cream on navy CTA", "primary-foreground", "primary", 4.5],
    ["Indigo accent on cream (UI, 3:1)", "indigo", "background", 3],
    ["Cream on destructive", "destructive-foreground", "destructive", 4.5],
    ["Cream on success", "success-foreground", "success", 4.5],
    ["Focus ring on cream (UI, 3:1)", "ring", "background", 3],
    ["Focus ring on card (UI, 3:1)", "ring", "card", 3],
    ["Input border on card (UI, 3:1)", "input", "card", 3],
    ["Card/row border on cream (UI, 3:1)", "border", "background", 3],
    ["Card/row border on white (UI, 3:1)", "border", "card", 3],
  ],
  dark: [
    ["Body text on dark", "foreground", "background", 4.5],
    ["Heading on dark", "navy", "background", 4.5],
    ["Muted copy on dark", "muted-foreground", "background", 4.5],
    ["Body text on dark card", "card-foreground", "card", 4.5],
    ["Muted copy on dark card", "muted-foreground", "card", 4.5],
    ["Text on dark hover wash", "accent-foreground", "accent", 4.5],
    ["Text on dark secondary", "secondary-foreground", "secondary", 4.5],
    ["Dark text on indigo CTA", "primary-foreground", "primary", 4.5],
    ["Dark on destructive", "destructive-foreground", "destructive", 4.5],
    ["Dark on success", "success-foreground", "success", 4.5],
    ["Focus ring on dark (UI, 3:1)", "ring", "background", 3],
    ["Input border on dark card (UI, 3:1)", "input", "card", 3],
    ["Card border on dark bg (UI, 3:1)", "border", "background", 3],
  ],
};

let failed = 0;
let checked = 0;

for (const mode of ["light", "dark"]) {
  const tokens = mode === "light" ? light : dark;
  console.log(`\n  ${mode === "light" ? "Light" : "Dark"} theme`);
  console.log("  " + "─".repeat(62));
  for (const [label, fg, bg, min] of PAIRS[mode]) {
    const fgHex = tokens[`--${fg}`];
    const bgHex = tokens[`--${bg}`];
    if (!fgHex || !bgHex) {
      console.log(`  MISSING TOKEN  ${label} (--${fg} / --${bg})`);
      failed += 1;
      checked += 1;
      continue;
    }
    const ratio = contrast(fgHex, bgHex);
    checked += 1;
    const pass = ratio >= min;
    if (!pass) failed += 1;
    const flag = pass ? "PASS" : "FAIL";
    console.log(
      `  ${flag}  ${label.padEnd(36)} ${fgHex} on ${bgHex}` +
        `  ${ratio.toFixed(2)}:1 (min ${min})`,
    );
  }
}

console.log(
  `\n  ${checked - failed}/${checked} pairs meet their required ratio` +
    (failed ? ` — ${failed} FAILING\n` : ` — WCAG 2.1 AA contrast satisfied\n`),
);

process.exit(failed ? 1 : 0);
