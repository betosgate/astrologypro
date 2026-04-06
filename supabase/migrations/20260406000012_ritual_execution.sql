-- Migration: ritual_execution
-- Purpose: Track ritual execution progress per user (persists step position across page reloads)
-- Date: 2026-04-06

ALTER TABLE public.user_ritual_configurations
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_step      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_complete       BOOLEAN NOT NULL DEFAULT false;
