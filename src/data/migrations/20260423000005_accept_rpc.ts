export const MIGRATION_SQL = `
-- ============================================================================
-- Task 03 — Accept flow RPC + user_id trigger guard
-- Sprint: 2026-04-23 affiliate-identity-refactor
--
-- consume_invite_and_activate_junction is the ONLY path that sets
-- affiliate_accounts.user_id. The trigger enforces this at the DB layer.
-- ============================================================================

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

DROP TRIGGER IF EXISTS trg_guard_affiliate_account_user_link ON affiliate_accounts;
CREATE TRIGGER trg_guard_affiliate_account_user_link
  BEFORE UPDATE OF user_id ON affiliate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION guard_affiliate_account_user_link();


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

  PERFORM set_config('app.allow_affiliate_account_user_link', 'true', true);

  UPDATE diviner_affiliates
     SET status = 'active', accepted_at = NOW()
   WHERE id = v_junction_id
     AND status = 'pending';

  UPDATE affiliate_accounts
     SET user_id = COALESCE(user_id, p_user_id),
         status  = CASE WHEN status = 'unclaimed' THEN 'active' ELSE status END,
         updated_at = NOW()
   WHERE id = v_account_id;

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
`;
