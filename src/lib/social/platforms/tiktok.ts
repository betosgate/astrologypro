// TikTok Content Posting adapter — disabled stub.
// Enable by implementing SocialPlatform + setting `enabled: true` in
// lib/social/platform-registry.ts.
//
// Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
// API access is INVITE-GATED and typically takes weeks to be approved.
// Video-only (no image/text posts). Multi-step upload flow.

import { makeDisabledAdapter } from "./_disabled-stub";

export const tiktokAdapter = makeDisabledAdapter("tiktok", "TikTok");
