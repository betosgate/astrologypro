import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { existsSync, writeFileSync } from "fs";
import { GEIST_BOLD_B64 } from "@/lib/geist-bold-b64";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Write Geist Bold to /tmp once per cold start so Pango can load it.
// Pango reads font files from disk; embedding base64 in SVG @font-face does not
// work on Vercel's librsvg build. /tmp is always writable in Lambda environments.
const FONT_TMP_PATH = "/tmp/geist-bold.ttf";
try {
  if (!existsSync(FONT_TMP_PATH)) {
    writeFileSync(FONT_TMP_PATH, Buffer.from(GEIST_BOLD_B64, "base64"));
  }
} catch {
  // Non-Lambda environment (dev Windows) — Pango will fall back to a system font.
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("img");
  const username = searchParams.get("user") ?? "astrologypro";
  // Note: searchParams from URL constructor is synchronous; Next.js 16 async searchParams
  // only applies to page/layout props, not route handler URL parsing.

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing img parameter" }, { status: 400 });
  }

  try {
    // Fetch base image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Get image dimensions
    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1080;

    const urlText = `astrologypro.com/${username}`;
    // Target font size ~4% of image width; DPI controls Pango text size.
    // At 72 DPI, Pango renders at ~1pt = 1px. We want ~fontSize px = width * 0.04pt at 72dpi.
    const targetPx = Math.max(20, Math.floor(width * 0.04));
    // Pango pt size → at 72dpi, 1pt = 1px
    const fontPt = targetPx;
    const stripH = Math.floor(targetPx * 2.2);
    const stripTop = height - stripH;

    // Pango markup: white bold text, specified font size, custom fontfile if available
    const fontFamily = existsSync(FONT_TMP_PATH) ? "Geist" : "sans-serif";
    const pangoMarkup = `<span font_family="${fontFamily}" font_size="${fontPt * 1024}" weight="bold" foreground="white">${urlText}</span>`;

    const fontfile = existsSync(FONT_TMP_PATH) ? FONT_TMP_PATH : undefined;

    // Render text to a transparent RGBA buffer using Pango
    const textMeta = await sharp({
      text: { text: pangoMarkup, fontfile, dpi: 72, rgba: true },
    }).metadata();

    const textW = textMeta.width ?? Math.floor(width * 0.7);
    const textH = textMeta.height ?? targetPx;

    const textBuf = await sharp({
      text: { text: pangoMarkup, fontfile, dpi: 72, rgba: true },
    })
      .png()
      .toBuffer();

    // Center text horizontally, vertically center within the strip
    const textLeft = Math.max(0, Math.floor((width - textW) / 2));
    const textTop = stripTop + Math.max(0, Math.floor((stripH - textH) / 2));

    const composited = await sharp(imageBuffer)
      .composite([
        // Semi-transparent dark strip behind text for legibility on any background
        {
          input: {
            create: {
              width,
              height: stripH,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0.55 },
            },
          },
          top: stripTop,
          left: 0,
          blend: "over",
        },
        // White text centered in the strip
        {
          input: textBuf,
          top: textTop,
          left: textLeft,
          blend: "over",
        },
      ])
      .jpeg({ quality: 88 })
      .toBuffer();

    return new NextResponse(composited as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[MundaneImage] Compositing error:", err);
    return NextResponse.json({ error: "Image processing failed" }, { status: 500 });
  }
}
