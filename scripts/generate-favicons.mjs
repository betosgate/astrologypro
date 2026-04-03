/**
 * Generates favicon PNGs at all required sizes from public/favicon.svg
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "favicon.svg");
const svgBuffer = readFileSync(svgPath);

const outputs = [
  // Standard browser favicons
  { size: 16,  out: "public/favicon-16x16.png" },
  { size: 32,  out: "public/favicon-32x32.png" },
  // Apple touch icon (iOS home screen)
  { size: 180, out: "public/apple-touch-icon.png" },
  // Android / PWA
  { size: 192, out: "public/android-chrome-192x192.png" },
  { size: 512, out: "public/android-chrome-512x512.png" },
  // Next.js app directory icons
  { size: 32,  out: "src/app/icon.png" },
  { size: 180, out: "src/app/apple-icon.png" },
];

for (const { size, out } of outputs) {
  const outPath = join(root, out);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log("\n✅ All favicon assets generated.");
