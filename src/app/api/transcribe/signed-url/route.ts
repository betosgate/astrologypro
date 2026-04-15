import { NextResponse } from "next/server";
import { createHmac, createHash } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Generates a pre-signed WebSocket URL for AWS Transcribe Streaming.
 * The client connects directly to AWS Transcribe — no audio passes through our server.
 * URL is valid for 5 minutes; the client reconnects automatically when it expires.
 */

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

export async function GET() {
  const region =
    process.env.AWS_CHIME_REGION ??
    process.env.AWS_REGION ??
    "us-east-1";

  const accessKeyId =
    process.env.AWS_CHIME_ACCESS_KEY_ID ??
    process.env.AWS_ACCESS_KEY_ID;

  const secretKey =
    process.env.AWS_CHIME_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretKey) {
    return NextResponse.json(
      { error: "AWS credentials not configured" },
      { status: 500 }
    );
  }

  const now = new Date();
  // YYYYMMDDTHHMMSSZ  (strip dashes, colons, milliseconds)
  const amzDate = now
    .toISOString()
    .replace(/[-:]|\.\d{3}/g, "")
    .replace("Z", "Z");
  const dateStamp = amzDate.slice(0, 8);

  const host = `transcribestreaming.${region}.amazonaws.com`;
  const path = "/stream-transcription-websocket";

  // Build query params — must be sorted alphabetically for signing
  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKeyId}/${dateStamp}/${region}/transcribe/aws4_request`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", "300"],
    ["X-Amz-SignedHeaders", "host"],
    ["language-code", "en-US"],
    ["media-encoding", "pcm"],
    ["sample-rate", "16000"],
    ["show-speaker-label", "false"],
  ];
  params.sort(([a], [b]) => a.localeCompare(b));

  const queryString = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  // AWS Signature V4
  const canonicalRequest = [
    "GET",
    path,
    queryString,
    `host:${host}\n`,
    "host",
    // SHA256 of empty payload
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/transcribe/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac("AWS4" + secretKey, dateStamp), region),
      "transcribe"
    ),
    "aws4_request"
  );

  const signature = hmac(signingKey, stringToSign).toString("hex");

  const signedUrl = `wss://${host}:8443${path}?${queryString}&X-Amz-Signature=${signature}`;

  return NextResponse.json({ url: signedUrl });
}
