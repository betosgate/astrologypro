import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "divineastroimage";
const REGION = "us-east-1";

const s3 = new S3Client({ region: REGION });

async function getFileUrl(key: string): Promise<string | null> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === "NotFound" || code === "NoSuchKey") return null;
    throw err;
  }
}

/**
 * POST /api/admin/astro/astro-picture-content
 * Fetches pictorial representations of astrological configurations from AWS S3.
 *
 * Body: { filename: string, foldername: string }
 * Filename patterns:
 *   Planets:  "Sun-In-Virgo"           → folder "planets"
 *   Aspects:  "Mars-Square-Pluto"      → folder "aspect"
 *   Houses:   "Sun-In-12th-House-With-Virgo" → folder "planets"
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { filename, foldername } = body as {
    filename?: string;
    foldername?: string;
  };

  if (!filename || !foldername) {
    return NextResponse.json(
      { status: "error", message: "filename and foldername are required" },
      { status: 422 },
    );
  }

  try {
    const basePath = foldername;
    const originalFilename = filename;

    // Step 1: try primary filename with multiple extensions (.webp, .jpg)
    const extensions = [".webp", ".jpg", ".png"];
    let url: string | null = null;

    for (const ext of extensions) {
      url = await getFileUrl(`${basePath}/${originalFilename}${ext}`);
      if (url) break;
    }

    // Step 2: fallback — Conjunction ↔ Conjunct naming variation
    if (!url) {
      const isConjunction = originalFilename.includes("Conjunction");
      const isConjunct = originalFilename.includes("Conjunct");

      if (isConjunction || isConjunct) {
        const altFilename = isConjunction
          ? originalFilename.replace("Conjunction", "Conjunct")
          : originalFilename.replace("Conjunct", "Conjunction");

        for (const ext of extensions) {
          url = await getFileUrl(`${basePath}/${altFilename}${ext}`);
          if (url) break;
        }
      }
    }

    if (!url) {
      return NextResponse.json(
        { status: "error", message: "No image found for this configuration" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: "success", data: { url } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "S3 fetch error";
    return NextResponse.json({ status: "error", message: msg }, { status: 502 });
  }
}
