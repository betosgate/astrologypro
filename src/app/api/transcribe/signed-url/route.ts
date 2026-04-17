import { NextResponse } from "next/server";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";

export const dynamic = "force-dynamic";

/**
 * Generates a pre-signed WebSocket URL for AWS Transcribe Streaming.
 * The client connects directly to AWS Transcribe — no audio passes through our server.
 * URL is valid for 5 minutes; the client reconnects automatically when it expires.
 *
 * Uses the official @smithy/signature-v4 presigner to avoid hand-rolled SigV4 bugs.
 */

export async function GET() {
  const region =
    process.env.AWS_CHIME_REGION ??
    process.env.AWS_REGION ??
    "us-east-1";

  const accessKeyId =
    process.env.AWS_CHIME_ACCESS_KEY_ID ??
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.AWS_CHIME_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY;

  const sessionToken =
    process.env.AWS_CHIME_SESSION_TOKEN ??
    process.env.AWS_SESSION_TOKEN ??
    undefined;

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: "AWS credentials not configured" },
      { status: 500 }
    );
  }

  const signer = new SignatureV4({
    credentials: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) },
    region,
    service: "transcribe",
    sha256: Sha256,
  });

  // Build the request to presign
  const request = new HttpRequest({
    method: "GET",
    protocol: "wss:",
    hostname: `transcribestreaming.${region}.amazonaws.com`,
    port: 8443,
    path: "/stream-transcription-websocket",
    query: {
      "language-code": "en-US",
      "media-encoding": "pcm",
      "sample-rate": "16000",
      "show-speaker-label": "false",
    },
    headers: {
      host: `transcribestreaming.${region}.amazonaws.com:8443`,
    },
  });

  const presigned = await signer.presign(request, {
    expiresIn: 300, // 5 minutes
  });

  // Reconstruct the full URL from the presigned request
  const qs = Object.entries(presigned.query ?? {})
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  const signedUrl = `wss://transcribestreaming.${region}.amazonaws.com:8443${presigned.path}?${qs}`;

  console.log("[signed-url] Generated presigned URL (first 200 chars):", signedUrl.slice(0, 200));

  return NextResponse.json({ url: signedUrl });
}
