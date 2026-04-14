-- Add last_session_at column to client_diviners
-- Referenced in src/app/dashboard/clients/page.tsx but never added to the schema.
ALTER TABLE public.client_diviners
  ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;

-- Backfill from completed bookings: max scheduled_at per (client_id, diviner_id)
UPDATE public.client_diviners cd
SET last_session_at = sub.last_at
FROM (
  SELECT
    client_id,
    diviner_id,
    MAX(scheduled_at) AS last_at
  FROM public.bookings
  WHERE status = 'completed'
    AND client_id IS NOT NULL
  GROUP BY client_id, diviner_id
) sub
WHERE cd.client_id = sub.client_id
  AND cd.diviner_id = sub.diviner_id;
