export const MIGRATION_SQL = `
-- ============================================================================
-- Task 02 follow-up — fix column/variable ambiguity in invite RPCs
--
-- The 20260423000003 migration defined the four invite RPCs with RETURNS TABLE
-- columns named the same as real table columns. Inside function bodies any
-- unqualified reference became ambiguous (PG 42702).
--
-- Fix: add #variable_conflict use_column pragma. Signature unchanged so the
-- shipped Task 02 API routes work unchanged. CREATE OR REPLACE idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_affiliate_invite(
  p_diviner_id        UUID,
  p_email             CITEXT,
  p_name              TEXT,
  p_phone             TEXT,
  p_message           TEXT,
  p_commission_type   TEXT,
  p_commission_value  NUMERIC,
  p_token_hash        TEXT,
  p_expires_at        TIMESTAMPTZ,
  p_created_by        UUID
) RETURNS TABLE (invite_id UUID, junction_id UUID, affiliate_account_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_account_id  UUID;
  v_junction_id UUID;
  v_invite_id   UUID;
  v_email_norm  CITEXT := TRIM(p_email);
  v_name_norm   TEXT   := TRIM(p_name);
  v_comm_type   TEXT   := COALESCE(p_commission_type, 'percentage');
  v_comm_val    NUMERIC := COALESCE(p_commission_value, 0);
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'email is required' USING ERRCODE = 'P0001';
  END IF;
  IF v_name_norm IS NULL OR v_name_norm = '' THEN
    RAISE EXCEPTION 'name is required' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO affiliate_accounts (email, name, phone, status)
  VALUES (v_email_norm, v_name_norm, NULLIF(TRIM(p_phone), ''), 'unclaimed')
  ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(NULLIF(TRIM(affiliate_accounts.name), ''), EXCLUDED.name)
  RETURNING id INTO v_account_id;

  IF EXISTS (SELECT 1 FROM affiliate_accounts WHERE id = v_account_id AND status = 'blocked') THEN
    RAISE EXCEPTION 'account_blocked' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM diviner_affiliates
    WHERE diviner_id = p_diviner_id
      AND affiliate_account_id = v_account_id
      AND status IN ('active','pending','suspended','blocked')
  ) THEN
    RAISE EXCEPTION 'junction_exists' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO diviner_affiliates (
    diviner_id, affiliate_account_id, status,
    default_commission_type, default_commission_value,
    notes, created_by, invited_at,
    name, email, phone
  )
  VALUES (
    p_diviner_id, v_account_id, 'pending',
    v_comm_type, v_comm_val,
    CASE WHEN p_message IS NULL OR p_message = ''
      THEN 'Invited via dashboard'
      ELSE 'Invitation: ' || p_message
    END,
    p_created_by, NOW(),
    v_name_norm, v_email_norm, NULLIF(TRIM(p_phone), '')
  )
  RETURNING id INTO v_junction_id;

  INSERT INTO affiliate_invites (
    diviner_id, affiliate_account_id, junction_id, email,
    token_hash, message, invited_by, expires_at
  ) VALUES (
    p_diviner_id, v_account_id, v_junction_id, v_email_norm,
    p_token_hash, p_message, p_created_by, p_expires_at
  )
  RETURNING id INTO v_invite_id;

  RETURN QUERY SELECT v_invite_id, v_junction_id, v_account_id;
END;
$$;


CREATE OR REPLACE FUNCTION resend_affiliate_invite(
  p_invite_id     UUID,
  p_caller_diviner_id UUID,
  p_new_token_hash TEXT,
  p_new_expires_at TIMESTAMPTZ
) RETURNS TABLE (invite_id UUID, junction_id UUID, affiliate_account_id UUID, email CITEXT, resent_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_original RECORD;
  v_new_id UUID;
BEGIN
  SELECT * INTO v_original
    FROM affiliate_invites ai
   WHERE ai.id = p_invite_id
     AND ai.diviner_id = p_caller_diviner_id
   FOR UPDATE;

  IF v_original.id IS NULL THEN
    RAISE EXCEPTION 'invite_not_found_or_not_owned' USING ERRCODE = 'P0003';
  END IF;

  IF v_original.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite_already_consumed' USING ERRCODE = 'P0004';
  END IF;

  UPDATE affiliate_invites
     SET revoked_at = NOW()
   WHERE junction_id = v_original.junction_id
     AND consumed_at IS NULL
     AND revoked_at IS NULL;

  INSERT INTO affiliate_invites (
    diviner_id, affiliate_account_id, junction_id, email,
    token_hash, message, invited_by, expires_at, resent_count
  ) VALUES (
    v_original.diviner_id, v_original.affiliate_account_id, v_original.junction_id,
    v_original.email, p_new_token_hash, v_original.message,
    v_original.invited_by, p_new_expires_at,
    COALESCE(v_original.resent_count, 0) + 1
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY
    SELECT v_new_id, v_original.junction_id, v_original.affiliate_account_id,
           v_original.email, COALESCE(v_original.resent_count, 0) + 1;
END;
$$;


CREATE OR REPLACE FUNCTION resend_affiliate_invite_by_junction(
  p_junction_id       UUID,
  p_caller_diviner_id UUID,
  p_new_token_hash    TEXT,
  p_new_expires_at    TIMESTAMPTZ,
  p_invited_by        UUID
) RETURNS TABLE (invite_id UUID, junction_id UUID, affiliate_account_id UUID, email CITEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_da RECORD;
  v_acc RECORD;
  v_new_id UUID;
BEGIN
  SELECT * INTO v_da
    FROM diviner_affiliates
   WHERE id = p_junction_id
     AND diviner_id = p_caller_diviner_id
   FOR UPDATE;

  IF v_da.id IS NULL THEN
    RAISE EXCEPTION 'junction_not_found_or_not_owned' USING ERRCODE = 'P0006';
  END IF;

  IF v_da.status <> 'pending' THEN
    RAISE EXCEPTION 'junction_not_pending' USING ERRCODE = 'P0006';
  END IF;

  SELECT * INTO v_acc FROM affiliate_accounts WHERE id = v_da.affiliate_account_id;
  IF v_acc.id IS NULL THEN
    RAISE EXCEPTION 'account_not_found' USING ERRCODE = 'P0006';
  END IF;
  IF v_acc.status = 'blocked' THEN
    RAISE EXCEPTION 'account_blocked' USING ERRCODE = 'P0001';
  END IF;

  UPDATE affiliate_invites
     SET revoked_at = NOW()
   WHERE junction_id = p_junction_id
     AND consumed_at IS NULL
     AND revoked_at IS NULL;

  INSERT INTO affiliate_invites (
    diviner_id, affiliate_account_id, junction_id, email,
    token_hash, invited_by, expires_at
  ) VALUES (
    v_da.diviner_id, v_da.affiliate_account_id, v_da.id, v_acc.email,
    p_new_token_hash, p_invited_by, p_new_expires_at
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY
    SELECT v_new_id, v_da.id, v_da.affiliate_account_id, v_acc.email;
END;
$$;


CREATE OR REPLACE FUNCTION revoke_affiliate_invite(
  p_invite_id         UUID,
  p_caller_diviner_id UUID
) RETURNS TABLE (invite_id UUID, junction_id UUID, junction_action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_invite RECORD;
  v_has_commissions BOOLEAN;
  v_action TEXT;
BEGIN
  SELECT * INTO v_invite
    FROM affiliate_invites ai
   WHERE ai.id = p_invite_id
     AND ai.diviner_id = p_caller_diviner_id
   FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'invite_not_found_or_not_owned' USING ERRCODE = 'P0003';
  END IF;

  IF v_invite.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite_already_consumed' USING ERRCODE = 'P0004';
  END IF;

  UPDATE affiliate_invites
     SET revoked_at = COALESCE(revoked_at, NOW())
   WHERE id = p_invite_id;

  SELECT EXISTS (
    SELECT 1 FROM affiliate_commissions
     WHERE affiliate_id = v_invite.junction_id
  ) INTO v_has_commissions;

  IF v_has_commissions THEN
    UPDATE diviner_affiliates
       SET status = 'suspended'
     WHERE id = v_invite.junction_id
       AND status = 'pending';
    v_action := 'suspended';
  ELSE
    DELETE FROM diviner_affiliates
     WHERE id = v_invite.junction_id
       AND status = 'pending';
    v_action := CASE WHEN FOUND THEN 'deleted' ELSE 'suspended' END;
  END IF;

  RETURN QUERY SELECT v_invite.id, v_invite.junction_id, v_action;
END;
$$;
`;
