-- ============================================================================
-- Task 03 — Accept flow RPC + user_id trigger guard
-- Sprint: 2026-04-23 affiliate-identity-refactor
--
-- consume_invite_and_activate_junction is the ONLY path that sets
-- affiliate_accounts.user_id. A trigger (guard_affiliate_account_user_link)
-- rejects any UPDATE OF user_id unless the calling transaction has set the
-- local GUC `app.allow_affiliate_account_user_link = 'true'`. The RPC sets
-- this GUC via `SET LOCAL` so it only applies inside its own transaction.
--
-- This enforces D5 (explicit invite-click only; no auto-link by email alone)
-- at the database layer — invulnerable to forgotten checks in route handlers.
--
-- Error codes raised:
--   P0003 → invite not claimable (not found, consumed, revoked, or expired)
--   P0004 → canonical account already linked to a different user
--   P0005 → external attempt to change affiliate_accounts.user_id
--           (never surfaces to users — internal safety net)
-- ============================================================================

-- ─── 1. guard_affiliate_account_user_link trigger function ──────────────────
CREATE OR REPLACE FUNCTION guard_affiliate_account_user_link()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id
     AND current_setting('app.allow_affiliate_account_user_link', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION
      'affiliate_accounts.user_id may only be changed by consume_invite_and_activate_junction'
      USING ERRCODE = 'P0005';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger. BEFORE UPDATE OF user_id fires on any user_id column update,
-- including service_role writes. Only the accept RPC can bypass it.
DROP TRIGGER IF EXISTS trg_guard_affiliate_account_user_link ON affiliate_accounts;
CREATE TRIGGER trg_guard_affiliate_account_user_link
  BEFORE UPDATE OF user_id ON affiliate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION guard_affiliate_account_user_link();


-- ─── 2. consume_invite_and_activate_junction RPC ────────────────────────────
-- Atomic: lock + claim invite → activate junction → link canonical account
-- to auth user. Returns the linked junction + account ids.
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_invite_and_activate_junction(
  p_invite_id UUID,
  p_user_id   UUID
) RETURNS TABLE (invite_id UUID, junction_id UUID, affiliate_account_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_junction_id UUID;
  v_account_id  UUID;
  v_invite_email CITEXT;
BEGIN
  IF p_invite_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'invite_id and user_id are required' USING ERRCODE = 'P0003';
  END IF;

  -- Claim the invite. The UPDATE ... RETURNING acts as a per-row lock: two
  -- concurrent accepts on the same token produce exactly one winner; the
  -- loser sees v_junction_id = NULL and hits the not_claimable branch.
  UPDATE affiliate_invites
     SET consumed_at = NOW(), consumed_by = p_user_id
   WHERE id = p_invite_id
     AND consumed_at IS NULL
     AND revoked_at IS NULL
     AND expires_at > NOW()
  RETURNING junction_id, affiliate_account_id, email
  INTO v_junction_id, v_account_id, v_invite_email;

  IF v_junction_id IS NULL THEN
    RAISE EXCEPTION 'invite_not_claimable' USING ERRCODE = 'P0003';
  END IF;

  -- Enable the trigger bypass for this transaction only. SET LOCAL is
  -- automatically cleared at COMMIT or ROLLBACK.
  PERFORM set_config('app.allow_affiliate_account_user_link', 'true', true);

  -- Activate the junction
  UPDATE diviner_affiliates
     SET status = 'active', accepted_at = NOW()
   WHERE id = v_junction_id
     AND status = 'pending';

  -- Link canonical account to auth user (idempotent if already set to same id).
  -- Account status flips from 'unclaimed' → 'active' on first link.
  UPDATE affiliate_accounts
     SET user_id = COALESCE(user_id, p_user_id),
         status  = CASE WHEN status = 'unclaimed' THEN 'active' ELSE status END,
         updated_at = NOW()
   WHERE id = v_account_id;

  -- Hard invariant: the account's user_id now matches the caller.
  -- If it's linked to a different user_id the accept is invalid — bail out
  -- loudly so we don't corrupt attribution.
  IF EXISTS (
    SELECT 1 FROM affiliate_accounts
     WHERE id = v_account_id
       AND user_id IS DISTINCT FROM p_user_id
  ) THEN
    RAISE EXCEPTION 'account_already_linked_to_different_user' USING ERRCODE = 'P0004';
  END IF;

  RETURN QUERY SELECT p_invite_id, v_junction_id, v_account_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION consume_invite_and_activate_junction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_invite_and_activate_junction TO service_role;
