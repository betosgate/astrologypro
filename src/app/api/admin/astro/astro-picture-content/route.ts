import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "divineastroimage";
const REGION = process.env.AWS_S3_REGION || "us-east-1";

async function fetchS3Config() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/astro/fetch-config`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keys: ["S3_BUCKET_ASSESSKEYID", "S3_BUCKET_SECRETACCESSKEY"]
      }),
    });

    if (!res.ok) {
      throw new Error(`fetch-config API returned status ${res.status}`);
    }

    const data = await res.json();
    const accessKeyId = data.S3_BUCKET_ASSESSKEYID;
    const secretAccessKey = data.S3_BUCKET_SECRETACCESSKEY;

    if (!accessKeyId || !secretAccessKey) {
      const keysPresent = Object.keys(data).join(", ");
      throw new Error(`S3 credentials missing in fetch-config response. Keys received: [${keysPresent}]`);
    }

    return { accessKeyId, secretAccessKey };
  } catch (err: any) {
    throw new Error(`fetchS3Config failed: ${err.message}`);
  }
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
    
    // Debug info for the user to see in production if it fails later
    const maskedAccessKey = config.accessKeyId ? `${config.accessKeyId.substring(0, 5)}...` : "missing";
    const maskedSecretKey = config.secretAccessKey ? `${config.secretAccessKey.substring(0, 5)}...` : "missing";
    console.log(`[debug] S3 config successfully fetched. AccessKey: ${maskedAccessKey}`);

    const s3 = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const basePath = foldername;
    const originalFilename = filename;
    const extensions = [".webp", ".jpg", ".png"];
    let url: string | null = null;

    for (const ext of extensions) {
      try {
        url = await getFileUrl(s3, `${basePath}/${originalFilename}${ext}`);
        if (url) break;
      } catch (innerErr: any) {
        // If it fails with a credential error, we want to know it's happening here
        throw new Error(`S3 Operation failed for ${originalFilename}${ext}: ${innerErr.message} (AccessKey: ${maskedAccessKey})`);
      }
    }

    if (!url) {
      // Step 2: fallback — Conjunction ↔ Conjunct naming variation
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
    
    // Return more details for production debugging as requested
    return NextResponse.json({ 
      status: "error", 
      message: msg,
      errorType: err instanceof Error ? err.name : typeof err,
      timestamp: new Date().toISOString()
    }, { status: 502 });
  }
}
