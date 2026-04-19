import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/debug/env-check
 * Admin-only diagnostic — returns which env vars are set and safe previews.
 * Never exposes full secret values. DELETE before production launch.
 */
export async function GET() {
  const adminEmail = await getAdminUser();
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  function preview(val: string | undefined, showChars = 8): string {
    if (!val) return "❌ NOT SET";
    if (val.length <= showChars + 4) return `✅ (${val.length} chars)`;
    return `✅ ${val.slice(0, showChars)}...${val.slice(-4)} (${val.length} chars)`;
  }

  function exact(val: string | undefined): string {
    if (!val) return "❌ NOT SET";
    return `✅ ${val}`;
  }

  const envReport = {
    _note: "Safe preview of env vars — no full secrets exposed",
    _adminEmail: adminEmail,
    _timestamp: new Date().toISOString(),

    // ── Supabase ──────────────────────────────────────────────
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: exact(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: preview(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: preview(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_ACCESS_TOKEN: preview(process.env.SUPABASE_ACCESS_TOKEN),
    },

    // ── Cron / Shared Secrets ─────────────────────────────────
    secrets: {
      CRON_SECRET: exact(process.env.CRON_SECRET),
    },

    // ── Stripe ────────────────────────────────────────────────
    stripe: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: preview(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      STRIPE_SECRET_KEY: preview(process.env.STRIPE_SECRET_KEY),
      STRIPE_WEBHOOK_SECRET: preview(process.env.STRIPE_WEBHOOK_SECRET),
    },

    // ── AWS Chime ─────────────────────────────────────────────
    chime: {
      AWS_CHIME_ACCESS_KEY_ID: preview(process.env.AWS_CHIME_ACCESS_KEY_ID, 12),
      AWS_CHIME_SECRET_ACCESS_KEY: preview(process.env.AWS_CHIME_SECRET_ACCESS_KEY),
      AWS_CHIME_REGION: exact(process.env.AWS_CHIME_REGION),
      CHIME_SMA_ID: exact(process.env.CHIME_SMA_ID),
      CHIME_RECORDING_BUCKET: exact(process.env.CHIME_RECORDING_BUCKET),
      NEXT_PUBLIC_CHIME_ENABLED: exact(process.env.NEXT_PUBLIC_CHIME_ENABLED),
      AWS_ACCOUNT_ID: exact(process.env.AWS_ACCOUNT_ID),
    },

    // ── Twilio ────────────────────────────────────────────────
    twilio: {
      TWILIO_ACCOUNT_SID: preview(process.env.TWILIO_ACCOUNT_SID),
      TWILIO_AUTH_TOKEN: preview(process.env.TWILIO_AUTH_TOKEN),
      TWILIO_PHONE_NUMBER: exact(process.env.TWILIO_PHONE_NUMBER),
      TWILIO_API_KEY_SID: preview(process.env.TWILIO_API_KEY_SID),
      TWILIO_API_KEY_SECRET: preview(process.env.TWILIO_API_KEY_SECRET),
    },

    // ── AWS SES ───────────────────────────────────────────────
    ses: {
      AWS_SES_ACCESS_KEY_ID: preview(process.env.AWS_SES_ACCESS_KEY_ID),
      AWS_SES_SECRET_ACCESS_KEY: preview(process.env.AWS_SES_SECRET_ACCESS_KEY),
      AWS_SES_REGION: exact(process.env.AWS_SES_REGION),
      AWS_SES_FROM_ADDRESS: exact(process.env.AWS_SES_FROM_ADDRESS),
    },

    // ── Google / Microsoft Calendar ───────────────────────────
    calendar: {
      GOOGLE_CLIENT_ID: preview(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: preview(process.env.GOOGLE_CLIENT_SECRET),
      GOOGLE_REDIRECT_URI: exact(process.env.GOOGLE_REDIRECT_URI),
      MICROSOFT_CLIENT_ID: preview(process.env.MICROSOFT_CLIENT_ID),
      MICROSOFT_CLIENT_SECRET: preview(process.env.MICROSOFT_CLIENT_SECRET),
      MICROSOFT_REDIRECT_URI: exact(process.env.MICROSOFT_REDIRECT_URI),
    },

    // ── App ───────────────────────────────────────────────────
    app: {
      NEXT_PUBLIC_APP_URL: exact(process.env.NEXT_PUBLIC_APP_URL),
      ADMIN_EMAILS: exact(process.env.ADMIN_EMAILS),
      NODE_ENV: exact(process.env.NODE_ENV),
      VERCEL_ENV: exact(process.env.VERCEL_ENV),
      VERCEL_URL: exact(process.env.VERCEL_URL),
    },

    // ── Astrology APIs ────────────────────────────────────────
    astrology: {
      ASTROLOGY_API_ACCESS_KEY: preview(process.env.ASTROLOGY_API_ACCESS_KEY),
      ASTROLOGY_API_SECRET_KEY: preview(process.env.ASTROLOGY_API_SECRET_KEY),
      ASTRO_AI_API_URL: exact(process.env.ASTRO_AI_API_URL),
      GEOAPIFY_API_KEY: preview(process.env.GEOAPIFY_API_KEY),
      ANTHROPIC_API_KEY: preview(process.env.ANTHROPIC_API_KEY),
    },

    // ── Social Media (Native Integration — replaces Ayrshare) ─
    social: {
      // Required for token encryption at rest (AES-256-GCM).
      // Must be 32 raw bytes: 64-char hex or base64 of 32 bytes.
      SOCIAL_TOKEN_ENCRYPTION_KEY: preview(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY),

      // X / Twitter — only platform enabled at launch.
      TWITTER_CLIENT_ID: preview(process.env.TWITTER_CLIENT_ID),
      TWITTER_CLIENT_SECRET: preview(process.env.TWITTER_CLIENT_SECRET),

      // Disabled platforms — leave unset at launch. Will be used
      // when their adapters are flipped on in platform-registry.ts.
      FACEBOOK_APP_ID: preview(process.env.FACEBOOK_APP_ID),
      FACEBOOK_APP_SECRET: preview(process.env.FACEBOOK_APP_SECRET),
      INSTAGRAM_APP_ID: preview(process.env.INSTAGRAM_APP_ID),
      INSTAGRAM_APP_SECRET: preview(process.env.INSTAGRAM_APP_SECRET),
      LINKEDIN_CLIENT_ID: preview(process.env.LINKEDIN_CLIENT_ID),
      LINKEDIN_CLIENT_SECRET: preview(process.env.LINKEDIN_CLIENT_SECRET),
      TIKTOK_CLIENT_KEY: preview(process.env.TIKTOK_CLIENT_KEY),
      TIKTOK_CLIENT_SECRET: preview(process.env.TIKTOK_CLIENT_SECRET),
      YOUTUBE_CLIENT_ID: preview(process.env.YOUTUBE_CLIENT_ID),
      YOUTUBE_CLIENT_SECRET: preview(process.env.YOUTUBE_CLIENT_SECRET),
    },
  };

  return NextResponse.json(envReport, { status: 200 });
}
