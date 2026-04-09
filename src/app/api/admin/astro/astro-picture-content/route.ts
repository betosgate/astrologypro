import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "divineastroimage";
const REGION = process.env.AWS_S3_REGION || "us-east-1";

async function fetchS3Config() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/astro/fetch-config`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keys: ["S3_BUCKET_ASSESSKEYID", "S3_BUCKET_SECRETACCESSKEY"]
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch S3 config: ${res.status}`);
  }

  const data = await res.json();
  const accessKeyId = data.S3_BUCKET_ASSESSKEYID;
  const secretAccessKey = data.S3_BUCKET_SECRETACCESSKEY;

  console.log("accessKeyId", accessKeyId);
  console.log("secretAccessKey", secretAccessKey);


  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 credentials (S3_BUCKET_ASSESSKEYID/S3_BUCKET_SECRETACCESSKEY) missing in fetch-config response");
  }

  return { accessKeyId, secretAccessKey };
}

async function getFileUrl(s3: S3Client, key: string): Promise<string | null> {
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
  // const user = await getAdminUser();
  // if (!user) {
  //   return NextResponse.json(
  //     { status: "error", message: "Unauthorized" },
  //     { status: 401 },
  //   );
  // }
  console.log("I am here-------");

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
    const config = await fetchS3Config();
    const s3 = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const basePath = foldername;
    const originalFilename = filename;

    // Step 1: try primary filename with multiple extensions (.webp, .jpg)
    const extensions = [".webp", ".jpg", ".png"];
    let url: string | null = null;

    for (const ext of extensions) {
      url = await getFileUrl(s3, `${basePath}/${originalFilename}${ext}`);
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
          url = await getFileUrl(s3, `${basePath}/${altFilename}${ext}`);
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
    console.error("[astro-picture-content] Error:", err);
    return NextResponse.json({ status: "error", message: msg }, { status: 502 });
  }
}
