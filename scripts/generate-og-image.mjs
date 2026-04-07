/**
 * OG Image Generator — AstrologyPro
 * Generates a 1200×630 PNG social card using sharp (SVG → PNG).
 *
 * Run: node scripts/generate-og-image.mjs
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../public/images/home/og-card.jpg");
const SVG_PATH = path.resolve(__dirname, "../public/images/home/og-card.svg");

// ─── Colours ────────────────────────────────────────────────────────────────
const BG      = "#06080f";
const GOLD    = "#c9a84c";
const GOLD2   = "#e8c96a";   // lighter highlight for glow
const CREAM   = "#f5f0e8";
const MUTED   = "#a89880";
const MUTED2  = "#7a6c5c";

// ─── Zodiac data ─────────────────────────────────────────────────────────────
const GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const GLYPH_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// Planet positions (angle in degrees from top, radius fraction 0–1 inside outerR)
const PLANETS = [
  { angle: 15,  r: 0.55 },
  { angle: 72,  r: 0.62 },
  { angle: 140, r: 0.48 },
  { angle: 200, r: 0.58 },
  { angle: 255, r: 0.52 },
  { angle: 310, r: 0.65 },
  { angle: 340, r: 0.45 },
];

// ─── Canvas helpers ──────────────────────────────────────────────────────────
const W = 1200;
const H = 630;

// Wheel lives in right ~45%
const CX = W * 0.745;
const CY = H * 0.5;
const OUTER_R  = 215;   // outermost ring
const GLYPH_R  = 197;   // glyph label radius
const RING1    = 170;   // inner edge of glyph band
const RING2    = 145;   // house ring outer
const RING3    = 115;   // house ring inner / aspect outer
const RING4    = 80;    // innermost decorative ring
const RING5    = 40;    // centre circle

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0° is top
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── Build SVG ───────────────────────────────────────────────────────────────
function buildSVG() {
  const lines = [];

  const push = (s) => lines.push(s);

  push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);

  // ── Defs ──────────────────────────────────────────────────────────────────
  push(`<defs>`);

  // Background radial gradient — subtle centre glow
  push(`<radialGradient id="bgGrad" cx="72%" cy="50%" r="55%">
    <stop offset="0%"   stop-color="#0d1222"/>
    <stop offset="100%" stop-color="${BG}"/>
  </radialGradient>`);

  // Left text panel gradient
  push(`<linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#0a0d1a" stop-opacity="1"/>
    <stop offset="85%"  stop-color="#0a0d1a" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="${BG}"   stop-opacity="0"/>
  </linearGradient>`);

  // Wheel glow filter
  push(`<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="3.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);

  // Strong glow for centre
  push(`<filter id="glowStrong" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="7" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);

  // Soft glow for wheel background halo
  push(`<radialGradient id="wheelHalo" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#1a1430" stop-opacity="0.9"/>
    <stop offset="70%"  stop-color="#0d1020" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="${BG}"   stop-opacity="0"/>
  </radialGradient>`);

  // Gold ring gradient for outer circle
  push(`<linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="${GOLD2}"/>
    <stop offset="50%"  stop-color="${GOLD}"/>
    <stop offset="100%" stop-color="#8a6a20"/>
  </linearGradient>`);

  // Clip text region
  push(`<clipPath id="leftClip">
    <rect x="0" y="0" width="${W * 0.6}" height="${H}"/>
  </clipPath>`);

  push(`</defs>`);

  // ── Background ────────────────────────────────────────────────────────────
  push(`<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>`);

  // Star field — tiny dots scattered
  const stars = [
    [60,40],[180,90],[300,25],[420,70],[540,30],[650,55],[750,20],[850,65],[960,35],[1100,80],
    [100,180],[220,200],[380,150],[500,195],[700,170],[820,130],[1050,185],[1150,160],
    [50,310],[170,340],[290,300],[450,330],[600,290],[780,320],[900,280],[1040,350],[1180,300],
    [80,450],[200,490],[350,430],[480,465],[630,440],[770,480],[930,420],[1080,460],
    [110,570],[250,590],[400,555],[560,580],[710,545],[870,585],[1020,560],[1160,590],
    [30,130],[145,255],[265,390],[385,510],[505,140],[625,370],[745,500],[865,240],[985,380],[1105,510],
  ];
  stars.forEach(([sx,sy]) => {
    const r = Math.random() * 1.5 + 0.3;
    const op = (Math.random() * 0.5 + 0.2).toFixed(2);
    push(`<circle cx="${sx}" cy="${sy}" r="${r.toFixed(1)}" fill="${CREAM}" opacity="${op}"/>`);
  });

  // ── Left panel overlay ────────────────────────────────────────────────────
  push(`<rect x="0" y="0" width="${W * 0.6}" height="${H}" fill="url(#panelGrad)"/>`);

  // ── Text content ──────────────────────────────────────────────────────────
  const TX = 72;  // text x origin

  // Brand label: "✦ DIVINE INFINITE BEING"
  push(`<text x="${TX}" y="135"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="15"
    letter-spacing="4"
    fill="${GOLD}"
    font-weight="600"
    text-transform="uppercase"
    opacity="0.95">✦  DIVINE INFINITE BEING</text>`);

  // Divider line below label
  push(`<line x1="${TX}" y1="148" x2="${TX + 280}" y2="148" stroke="${GOLD}" stroke-width="0.8" opacity="0.5"/>`);

  // Main headline "AstrologyPro"
  push(`<text x="${TX}" y="250"
    font-family="Georgia, 'Palatino Linotype', Palatino, serif"
    font-size="88"
    fill="${CREAM}"
    font-weight="700"
    letter-spacing="-1">AstrologyPro</text>`);

  // Tagline
  push(`<text x="${TX}" y="302"
    font-family="Georgia, serif"
    font-size="24"
    fill="${MUTED}"
    letter-spacing="1"
    font-style="italic">Professional Astrology &amp; Tarot Readings</text>`);

  // Sub-line
  push(`<text x="${TX}" y="342"
    font-family="Georgia, serif"
    font-size="17"
    fill="${MUTED2}"
    letter-spacing="0.5">Book a private reading with a certified diviner</text>`);

  // Horizontal rule
  push(`<line x1="${TX}" y1="378" x2="${TX + 380}" y2="378" stroke="${GOLD}" stroke-width="0.6" opacity="0.35"/>`);

  // Feature pills / badges
  const pills = ["Natal Charts", "Tarot Spreads", "Video Sessions", "Birth Reports"];
  let pillX = TX;
  pills.forEach((label) => {
    const pw = label.length * 9.5 + 28;
    push(`<rect x="${pillX}" y="392" width="${pw}" height="28" rx="14" fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.5"/>`);
    push(`<text x="${pillX + pw/2}" y="411" text-anchor="middle"
      font-family="Georgia, serif" font-size="12" fill="${MUTED}" letter-spacing="0.5">${label}</text>`);
    pillX += pw + 12;
  });

  // Bottom star row
  const starY = 490;
  const starSpacing = 32;
  const starStartX = TX;
  for (let i = 0; i < 3; i++) {
    push(`<text x="${starStartX + i * starSpacing}" y="${starY}"
      font-family="Georgia, serif" font-size="20" fill="${GOLD}" opacity="0.8" filter="url(#glow)">✦</text>`);
  }

  // URL / domain hint
  push(`<text x="${TX}" y="530"
    font-family="Georgia, serif"
    font-size="13"
    fill="${MUTED2}"
    letter-spacing="1">astrologypro.com</text>`);

  // ── Wheel halo ────────────────────────────────────────────────────────────
  push(`<circle cx="${CX}" cy="${CY}" r="${OUTER_R + 30}" fill="url(#wheelHalo)"/>`);

  // ── Zodiac wheel ──────────────────────────────────────────────────────────
  // Outer ring fill (glyph band background, very subtle)
  push(`<circle cx="${CX}" cy="${CY}" r="${OUTER_R}" fill="none" stroke="url(#goldRing)" stroke-width="1.5" opacity="0.9" filter="url(#glow)"/>`);
  push(`<circle cx="${CX}" cy="${CY}" r="${RING1}"  fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.55"/>`);
  push(`<circle cx="${CX}" cy="${CY}" r="${RING2}"  fill="none" stroke="${GOLD}" stroke-width="0.7" opacity="0.45"/>`);
  push(`<circle cx="${CX}" cy="${CY}" r="${RING3}"  fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.35"/>`);
  push(`<circle cx="${CX}" cy="${CY}" r="${RING4}"  fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="0.3"/>`);
  push(`<circle cx="${CX}" cy="${CY}" r="${RING5}"  fill="none" stroke="${GOLD}" stroke-width="1"   opacity="0.5" filter="url(#glow)"/>`);

  // Glyph band subtle fill
  push(`<circle cx="${CX}" cy="${CY}" r="${OUTER_R}" fill="#0d0f1e" opacity="0.0"/>`);

  // 12 house dividers — long spokes from outer to innermost
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const outer = polar(CX, CY, OUTER_R, angle);
    const inner = polar(CX, CY, RING4, angle);
    push(`<line x1="${outer.x.toFixed(1)}" y1="${outer.y.toFixed(1)}" x2="${inner.x.toFixed(1)}" y2="${inner.y.toFixed(1)}" stroke="${GOLD}" stroke-width="0.6" opacity="0.35"/>`);
    // Outer tick
    const tickInner = polar(CX, CY, OUTER_R - 8, angle);
    push(`<line x1="${outer.x.toFixed(1)}" y1="${outer.y.toFixed(1)}" x2="${tickInner.x.toFixed(1)}" y2="${tickInner.y.toFixed(1)}" stroke="${GOLD}" stroke-width="1.2" opacity="0.7"/>`);
  }

  // Minor ticks (5° increments between each sign)
  for (let i = 0; i < 72; i++) {
    const angle = i * 5;
    if (angle % 30 === 0) continue; // skip major lines
    const outer = polar(CX, CY, OUTER_R, angle);
    const inner = polar(CX, CY, OUTER_R - 5, angle);
    push(`<line x1="${outer.x.toFixed(1)}" y1="${outer.y.toFixed(1)}" x2="${inner.x.toFixed(1)}" y2="${inner.y.toFixed(1)}" stroke="${GOLD}" stroke-width="0.5" opacity="0.35"/>`);
  }

  // Zodiac glyphs in the outer band
  GLYPHS.forEach((glyph, i) => {
    const angle = i * 30 + 15; // centre of each sign segment
    const pos = polar(CX, CY, (OUTER_R + RING1) / 2 + 2, angle);
    push(`<text x="${pos.x.toFixed(1)}" y="${(pos.y + 7).toFixed(1)}"
      text-anchor="middle"
      font-family="Georgia, serif"
      font-size="18"
      fill="${GOLD}"
      opacity="0.88"
      filter="url(#glow)">${glyph}</text>`);
  });

  // House numbers (1–12) in the ring between RING2 and RING3
  for (let i = 0; i < 12; i++) {
    const angle = i * 30 + 15;
    const pos = polar(CX, CY, (RING2 + RING3) / 2, angle);
    push(`<text x="${pos.x.toFixed(1)}" y="${(pos.y + 4.5).toFixed(1)}"
      text-anchor="middle"
      font-family="Georgia, serif"
      font-size="10"
      fill="${MUTED}"
      opacity="0.5">${i + 1}</text>`);
  }

  // Aspect lines in the innermost circle (a pentagram-like cross-pattern)
  const aspectAngles = [0, 72, 144, 216, 288]; // quintile pattern
  const aspectPairs = [[0,2],[0,3],[1,3],[1,4],[2,4],[0,1],[1,2],[2,3],[3,4],[4,0]]; // star
  aspectPairs.forEach(([a, b]) => {
    const pa = polar(CX, CY, RING4 - 8, aspectAngles[a]);
    const pb = polar(CX, CY, RING4 - 8, aspectAngles[b]);
    push(`<line x1="${pa.x.toFixed(1)}" y1="${pa.y.toFixed(1)}" x2="${pb.x.toFixed(1)}" y2="${pb.y.toFixed(1)}" stroke="${GOLD}" stroke-width="0.5" opacity="0.2"/>`);
  });

  // Planet dots
  PLANETS.forEach(({ angle, r }) => {
    const pos = polar(CX, CY, r * RING3, angle);
    push(`<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="4.5" fill="${GOLD2}" opacity="0.85" filter="url(#glowStrong)"/>`);
    push(`<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="2" fill="${CREAM}" opacity="0.9"/>`);
  });

  // Centre symbol — a sun/eye ornament
  push(`<circle cx="${CX}" cy="${CY}" r="14" fill="#0d0f1e" stroke="${GOLD}" stroke-width="1" opacity="0.7"/>`);
  push(`<text x="${CX}" y="${CY + 7}"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="18"
    fill="${GOLD}"
    opacity="0.9"
    filter="url(#glowStrong)">☉</text>`);

  // ── Bottom border line ─────────────────────────────────────────────────────
  push(`<line x1="0" y1="${H - 4}" x2="${W}" y2="${H - 4}" stroke="${GOLD}" stroke-width="0.5" opacity="0.3"/>`);
  push(`<line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" stroke="${GOLD}" stroke-width="1" opacity="0.15"/>`);

  // ── Top border line ────────────────────────────────────────────────────────
  push(`<line x1="0" y1="3" x2="${W}" y2="3" stroke="${GOLD}" stroke-width="0.5" opacity="0.3"/>`);

  push(`</svg>`);
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const svg = buildSVG();

// Write SVG for reference
writeFileSync(SVG_PATH, svg, "utf8");
console.log(`SVG written to: ${SVG_PATH}`);

// Convert SVG → PNG via sharp
await sharp(Buffer.from(svg))
  .png({ quality: 100, compressionLevel: 6 })
  .resize(W, H, { fit: "fill" })
  .toFile(OUT_PATH);

console.log(`OG image written to: ${OUT_PATH}`);
