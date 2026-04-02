import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { GEIST_BOLD_B64 } from "@/lib/geist-bold-b64";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Font embedded at build time as a base64 constant — no filesystem access needed.
// This ensures the Geist Bold TTF is always available in the Vercel Lambda, where
// readFileSync on node_modules paths is unreliable (file not included in bundle trace).
const FONT_B64 = GEIST_BOLD_B64;

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
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 }
      );
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Get image dimensions
    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1080;

    const textY = Math.floor(height * 0.875);
    const fontSize = Math.floor(width * 0.038);
    const urlText = `astrologypro.com/${username}`;

    // Embed Geist font via base64 @font-face so librsvg renders text without
    // needing system fonts on Vercel's Lambda environment.
    const fontFaceBlock = FONT_B64
      ? `<defs><style>@font-face{font-family:'Geist';src:url('data:font/truetype;base64,${FONT_B64}');font-weight:bold;}</style></defs>`
      : "";

    const fontFamily = FONT_B64 ? "Geist, sans-serif" : "sans-serif";

    // Two-pass render: black shadow layer then white text layer for legibility
    const svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${fontFaceBlock}
      <text
        x="${width / 2}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        font-weight="bold"
        stroke="black"
        stroke-width="${Math.ceil(fontSize * 0.18)}"
        stroke-linejoin="round"
        fill="black"
      >${urlText}</text>
      <text
        x="${width / 2}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
      >${urlText}</text>
    </svg>`;

    const composited = await sharp(imageBuffer)
      .composite([{ input: Buffer.from(svgOverlay) as unknown as Buffer, top: 0, left: 0 }])
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
    return NextResponse.json(
      { error: "Image processing failed" },
      { status: 500 }
    );
  }
}
