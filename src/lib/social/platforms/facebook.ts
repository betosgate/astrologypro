// Facebook Page posting adapter — disabled stub.
// Enable by implementing the SocialPlatform contract + setting
// `enabled: true` in lib/social/platform-registry.ts.
//
// Docs when we build this out:
//   https://developers.facebook.com/docs/graph-api/reference/page/feed
//   OAuth: https://developers.facebook.com/docs/facebook-login/guides/access-tokens
// Required: Facebook App + Business Verification + Page Publishing permission
// which go through Meta App Review (~2–6 weeks).

import { makeDisabledAdapter } from "./_disabled-stub";

export const facebookAdapter = makeDisabledAdapter("facebook", "Facebook Page");
