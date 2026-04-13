ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS live_session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS check_ins_live_session_id_idx
  ON public.check_ins(live_session_id, created_at DESC)
  WHERE live_session_id IS NOT NULL;
