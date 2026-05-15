-- Migration: Calendar Events Recurrence (20260515000001)

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS event_timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS recurrence_series_id UUID,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB,
  ADD COLUMN IF NOT EXISTS recurrence_position INTEGER,
  ADD COLUMN IF NOT EXISTS recurrence_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_series
  ON public.calendar_events (recurrence_series_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_parent
  ON public.calendar_events (recurrence_parent_id);
