-- Migration: user_ritual_configurations
-- Purpose: Store perennial mandalism users' saved ritual configurations
-- Date: 2026-04-04

CREATE TABLE IF NOT EXISTS public.user_ritual_configurations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_member_id  uuid REFERENCES public.community_members(id) ON DELETE SET NULL,
  ritual_name          text NOT NULL,
  ritual_tags          text[] NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Index: fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_ritual_configurations_user_id
  ON public.user_ritual_configurations (user_id);

-- Index: ordering by created_at
CREATE INDEX IF NOT EXISTS idx_user_ritual_configurations_created_at
  ON public.user_ritual_configurations (user_id, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_ritual_configurations_updated_at
  BEFORE UPDATE ON public.user_ritual_configurations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.user_ritual_configurations ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own ritual configurations
CREATE POLICY "ritual_configs_select_own"
  ON public.user_ritual_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ritual_configs_insert_own"
  ON public.user_ritual_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ritual_configs_update_own"
  ON public.user_ritual_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ritual_configs_delete_own"
  ON public.user_ritual_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- Service-role bypass (used by admin API and crons)
CREATE POLICY "ritual_configs_service_role"
  ON public.user_ritual_configurations
  USING (auth.role() = 'service_role');
