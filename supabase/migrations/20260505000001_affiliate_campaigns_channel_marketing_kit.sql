-- Phase 1.5 follow-up: extend affiliate_campaigns.channel CHECK to allow
-- 'marketing_kit'. The lazy-create in fetchMarketingKitItems
-- (src/lib/affiliate-marketing-kit.ts) tags Marketing-Kit-spawned general
-- campaigns with channel='marketing_kit' so analytics can attribute
-- conversions to that surface separately from 'direct'/'other'. Original
-- allowlist (20260417000010) predated Phase 1.5 and didn't include it,
-- causing every lazy-create to fail with a constraint violation and the
-- Marketing Kit to render empty.

ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_channel_check;

ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_channel_check
    CHECK (
      channel IS NULL OR channel IN (
        'facebook',
        'instagram',
        'whatsapp',
        'youtube',
        'email',
        'twitter',
        'tiktok',
        'linkedin',
        'direct',
        'other',
        'marketing_kit'
      )
    );
