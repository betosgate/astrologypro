const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = process.cwd();
const SVG_PATH = path.join(ROOT, 'favicon-new.svg');
const svg = fs.readFileSync(SVG_PATH);

const targets = [
  { out: path.join(ROOT, 'public/favicon-16x16.png'), size: 16 },
  { out: path.join(ROOT, 'public/favicon-32x32.png'), size: 32 },
  { out: path.join(ROOT, 'public/apple-touch-icon.png'), size: 180 },
  { out: path.join(ROOT, 'src/app/icon.png'), size: 512 },
];

async function main() {
  for (const t of targets) {
    await sharp(svg, { density: 384 })
      .resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(t.out);
    console.log('wrote', t.out, t.size + 'px');
  }

  // Replace the canonical SVG too.
  fs.copyFileSync(SVG_PATH, path.join(ROOT, 'public/favicon.svg'));
  console.log('copied favicon-new.svg -> public/favicon.svg');
}

main().catch((e) => { console.error(e); process.exit(1); });
