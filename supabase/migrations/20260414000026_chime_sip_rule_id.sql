-- ============================================================================
-- Add chime_sip_rule_id to diviners
--
-- Each provisioned Chime PSTN phone number is routed to the SMA via a SIP
-- Rule. We store the SIP Rule ID so we can delete it on number release.
-- Additive only — no existing columns or constraints changed.
-- ============================================================================

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS chime_sip_rule_id TEXT;
