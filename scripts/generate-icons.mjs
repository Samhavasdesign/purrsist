// Regenerates the PWA / home-screen icons from the brand mark.
//
// Source of truth: src/app/icon.svg (the cat mark used as the browser-tab
// favicon). This script strips its rounded-rect background, fits the artwork
// onto a full-bleed plum square with maskable-safe padding, and writes:
//
//   public/icons/icon.svg          full-bleed vector source (any + maskable)
//   public/icons/apple-touch-icon.png   180x180, opaque
//   public/icons/icon-192.png           192x192, opaque
//   public/icons/icon-512.png           512x512, opaque
//
// Run: node scripts/generate-icons.mjs

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#2a2530"; // brand plum — matches src/app/icon.svg
const COVERAGE = 0.7; // longest edge of the artwork as a fraction of the canvas
const VIEW = 32; // src/app/icon.svg viewBox is 0 0 32 32

// 1. Pull the artwork group out of the favicon, dropping its <rect> background.
const favicon = await readFile(join(root, "src/app/icon.svg"), "utf8");
const group = favicon.match(/<g[\s\S]*<\/g>/);
if (!group) throw new Error("Could not find the <g> artwork in src/app/icon.svg");
const art = group[0];

// 2. Render the artwork alone at high res and trim the transparent margin to
//    get its exact bounding box in viewBox units.
const SCALE = 64; // 32 * 64 = 2048px working canvas
const artOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="${VIEW * SCALE}" height="${VIEW * SCALE}">${art}</svg>`;
const trimmed = await sharp(Buffer.from(artOnly)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const { trimOffsetLeft = 0, trimOffsetTop = 0 } = trimmed.info;
const box = {
  x: -trimOffsetLeft / SCALE,
  y: -trimOffsetTop / SCALE,
  w: trimmed.info.width / SCALE,
  h: trimmed.info.height / SCALE,
};

// 3. Scale + centre the artwork so its longest edge is COVERAGE of the canvas.
const k = (COVERAGE * VIEW) / Math.max(box.w, box.h);
const tx = VIEW / 2 - (box.x + box.w / 2) * k;
const ty = VIEW / 2 - (box.y + box.h / 2) * k;

const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="512" height="512">
  <rect width="${VIEW}" height="${VIEW}" fill="${BG}" />
  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(4)})">
    ${art}
  </g>
</svg>
`;

await writeFile(join(root, "public/icons/icon.svg"), fullBleed);

// 4. Rasterise to the sizes the manifest and <head> reference. flatten() drops
//    any alpha so iOS/Android never sees a transparent corner.
const targets = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];
for (const [name, size] of targets) {
  await sharp(Buffer.from(fullBleed))
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toFile(join(root, "public/icons", name));
  console.log(`wrote public/icons/${name}  (${size}x${size})`);
}
console.log("wrote public/icons/icon.svg");
