const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = fs.readFileSync(path.join(__dirname, 'favicon-new.svg'));

async function pngBuf(size) {
  return await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  // Render the three sizes ICO traditionally embeds.
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(sizes.map(pngBuf));
  // Write each as a temp PNG so ImageMagick can pack them into an .ico.
  for (let i = 0; i < sizes.length; i++) {
    fs.writeFileSync(path.join(__dirname, `.ico-tmp-${sizes[i]}.png`), buffers[i]);
  }
  console.log('ico-tmp pngs written:', sizes.join(','));
}

main().catch((e) => { console.error(e); process.exit(1); });
