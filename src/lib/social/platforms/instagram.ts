// Instagram Business adapter — disabled stub.
// Enable by implementing SocialPlatform + setting `enabled: true` in
// lib/social/platform-registry.ts.
//
// Uses the same Meta App as Facebook. Requires a Business/Creator IG
// account linked to a Facebook Page. 2-step media container flow:
//   1. POST /{ig-user-id}/media        (creates container)
//   2. POST /{ig-user-id}/media_publish (publishes it)

import { makeDisabledAdapter } from "./_disabled-stub";

export const instagramAdapter = makeDisabledAdapter("instagram", "Instagram");
