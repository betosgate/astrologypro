import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  return (
    process.env.WEEKLY_SUBSCRIPTION_MANAGE_TOKEN_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.STRIPE_WEBHOOK_SECRET ??
    "astrologypro-weekly-subscription"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createWeeklySubscriptionManageToken(input: {
  subscriberId: string;
  email: string;
  expiresInSeconds?: number;
}) {
  const payload = JSON.stringify({
    sub: input.subscriberId,
    email: input.email.toLowerCase(),
    exp:
      Math.floor(Date.now() / 1000) +
      (input.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS),
  });
  const encodedPayload = base64UrlEncode(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyWeeklySubscriptionManageToken(token: string): {
  valid: boolean;
  subscriberId: string | null;
  email: string | null;
} {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { valid: false, subscriberId: null, email: null };
  }

  const expected = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const actual = Buffer.from(expected);
  if (
    provided.length !== actual.length ||
    !timingSafeEqual(provided, actual)
  ) {
    return { valid: false, subscriberId: null, email: null };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.email || !payload.exp) {
      return { valid: false, subscriberId: null, email: null };
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, subscriberId: null, email: null };
    }
    return {
      valid: true,
      subscriberId: payload.sub,
      email: payload.email,
    };
  } catch {
    return { valid: false, subscriberId: null, email: null };
  }
}
