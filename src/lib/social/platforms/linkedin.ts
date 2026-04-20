// LinkedIn adapter — disabled stub.
// Enable by implementing SocialPlatform + setting `enabled: true` in
// lib/social/platform-registry.ts.
//
// Docs: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
// UGC posts: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/posts-api
// Tokens expire in 60 days and cannot be silently refreshed — users must
// reauthorize. The UI will need to surface a "reconnect LinkedIn" banner
// when expiry is near.

import { makeDisabledAdapter } from "./_disabled-stub";

export const linkedinAdapter = makeDisabledAdapter("linkedin", "LinkedIn");
