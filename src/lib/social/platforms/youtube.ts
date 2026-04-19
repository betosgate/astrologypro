// YouTube Shorts adapter — disabled stub.
// Enable by implementing SocialPlatform + setting `enabled: true` in
// lib/social/platform-registry.ts.
//
// Docs: https://developers.google.com/youtube/v3/docs/videos/insert
// Uses Google OAuth 2.0. Video upload is a resumable multi-step flow.
// YouTube has daily upload quota limits — plan for per-user rate limiting.

import { makeDisabledAdapter } from "./_disabled-stub";

export const youtubeAdapter = makeDisabledAdapter("youtube", "YouTube");
