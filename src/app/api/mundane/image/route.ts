import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Calculate text position — center of the bottom 25% strip
    const textY = Math.floor(height * 0.875);
    const fontSize = Math.floor(width * 0.038);
    const url = `www.astrologypro.com/${username}`;

    // SVG text overlay — white text with black stroke for legibility over any background
    const svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${width / 2}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        stroke="black"
        stroke-width="${Math.floor(fontSize * 0.15)}"
        stroke-linejoin="round"
        paint-order="stroke"
        fill="black"
      >${url}</text>
      <text
        x="${width / 2}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
      >${url}</text>
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
