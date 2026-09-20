#!/usr/bin/env node
/**
 * Rebuilds src/lib/og-fonts.ts from the TTF files in src/assets/fonts.
 *
 * Satori (behind @vercel/og) parses TTF/OTF only — WOFF2 and EOT both fail —
 * so the latin subsets are kept as TTF and inlined as base64. That keeps the
 * Open Graph routes free of network and filesystem access, which matters
 * because they are prerendered at build time.
 *
 * Usage: npm run gen:og-fonts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FONTS = [
  { file: "inter-400.ttf", exportName: "INTER_400_BASE64", label: "Inter 400" },
  { file: "inter-700.ttf", exportName: "INTER_700_BASE64", label: "Inter 700" },
  {
    file: "playfair-700.ttf",
    exportName: "PLAYFAIR_700_BASE64",
    label: "Playfair Display 700",
  },
];

function wrap(base64) {
  const chunks = base64.match(/.{1,100}/g) ?? [];
  return chunks
    .map((chunk, index) =>
      index === chunks.length - 1 ? `  "${chunk}"` : `  "${chunk}" +`,
    )
    .join("\n");
}

const blocks = FONTS.map(({ file, exportName, label }) => {
  const base64 = readFileSync(join(root, "src/assets/fonts", file)).toString(
    "base64",
  );
  return `/** ${label} (${file}) */\nexport const ${exportName} =\n${wrap(base64)};`;
});

const out = `/**
 * Font binaries for the Open Graph image generator, inlined as base64.
 *
 * Satori needs the real font *data* and only accepts TTF/OTF; next/font only
 * hands out a URL, which cannot be fetched while a route is prerendered at
 * build time (nothing is serving yet). Inlining keeps card generation offline
 * and instant.
 *
 * DO NOT EDIT BY HAND — generated from src/assets/fonts.
 * Regenerate with:  npm run gen:og-fonts
 */

${blocks.join("\n\n")}

/** Decode a base64 font into the ArrayBuffer Satori expects. */
function buffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Ready-made \`fonts\` array for new ImageResponse(..., { fonts }). */
export const OG_FONTS = [
  { name: "Inter", data: buffer(INTER_400_BASE64), style: "normal", weight: 400 },
  { name: "Inter", data: buffer(INTER_700_BASE64), style: "normal", weight: 700 },
  {
    name: "Playfair Display",
    data: buffer(PLAYFAIR_700_BASE64),
    style: "normal",
    weight: 700,
  },
] as const;
`;

writeFileSync(join(root, "src/lib/og-fonts.ts"), out);
console.log(`Wrote src/lib/og-fonts.ts (${out.length} bytes)`);
