import { SignJWT } from "jose";

/**
 * Generate a VideoSDK participant token.
 * Uses HS256 JWT — no npm package needed; jose is bundled with Next.js.
 */
export async function generateVideoSDKToken(
  roomId: string,
  participantId: string,
  participantName: string,
  role: "host" | "guest",
  expiresInSeconds = 3600
): Promise<string> {
  const apiKey = process.env.VIDEOSDK_API_KEY;
  const secret = process.env.VIDEOSDK_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new Error("VideoSDK credentials not configured");
  }

  const secretKey = new TextEncoder().encode(secret);
  const token = await new SignJWT({
    apikey: apiKey,
    permissions:
      role === "host" ? ["allow_join", "allow_mod"] : ["allow_join"],
    version: 2,
    roomId,
    participantId,
    participantName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretKey);

  return token;
}

/**
 * Create a new VideoSDK room via their REST API.
 * Returns the roomId assigned by VideoSDK.
 */
export async function createVideoSDKRoom(
  customRoomId?: string
): Promise<{ roomId: string }> {
  const apiKey = process.env.VIDEOSDK_API_KEY;
  const secret = process.env.VIDEOSDK_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new Error("VideoSDK credentials not configured");
  }

  // Short-lived management token (no roomId/participantId scope)
  const secretKey = new TextEncoder().encode(secret);
  const mgmtToken = await new SignJWT({
    apikey: apiKey,
    permissions: ["allow_join", "allow_mod"],
    version: 2,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey);

  const body: Record<string, unknown> = {};
  if (customRoomId) body.customRoomId = customRoomId;

  const res = await fetch("https://api.videosdk.live/v2/rooms", {
    method: "POST",
    headers: {
      Authorization: mgmtToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`VideoSDK room creation failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { roomId: string };
  return { roomId: data.roomId };
}

/** Returns true if VideoSDK env vars are present. */
export function isVideoSDKConfigured(): boolean {
  return Boolean(process.env.VIDEOSDK_API_KEY && process.env.VIDEOSDK_SECRET_KEY);
}
