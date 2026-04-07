-- Testimonial enhancements: public submission, moderation workflow, spam scoring
-- Existing columns: id, diviner_id, client_id, client_name, rating, text,
--   service_type, status (pending/approved/rejected), featured, booking_id,
--   images, audio, video, title, updated_at, created_at
--
-- RLS already enabled. Existing policies:
--   testimonials_diviner_all, testimonials_public_read, testimonials_client_insert
-- We do NOT recreate those.

-- 1. Widen the status CHECK to include new workflow states.
--    Drop old constraint by name (it was created inline; PG names it
--    testimonials_status_check), then add the new one.
ALTER TABLE testimonials
  DROP CONSTRAINT IF EXISTS testimonials_status_check;

ALTER TABLE testimonials
  ADD CONSTRAINT testimonials_status_check
  CHECK (status IN ('submitted','pending_review','approved','rejected','hidden','pending'));

-- 2. Add new columns (all additive — skip if already present).
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS display_alias text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS diviner_response text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS moderation_notes text;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS spam_score numeric(3,2) DEFAULT 0;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false;

-- 3. Indexes for public display queries.
CREATE INDEX IF NOT EXISTS testimonials_diviner_status_idx
  ON testimonials(diviner_id, status, is_featured);

CREATE INDEX IF NOT EXISTS testimonials_status_idx
  ON testimonials(status);

-- 4. New RLS policies for unauthenticated public submission.
--    The existing "testimonials_public_read" policy only allows status='approved',
--    which is still correct. We keep it and add a policy that permits anyone to
--    INSERT with status='submitted'.
--
--    NOTE: "public_read_approved_testimonials" and "public_submit_testimonials"
--    and "diviners_manage_own_testimonials" are NEW — they do not conflict with
--    the existing named policies.
--
--    "testimonials_client_insert" already handles authenticated client inserts;
--    we add a separate policy for anonymous/unauthenticated public submissions.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'testimonials'
      AND policyname = 'public_submit_testimonials'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "public_submit_testimonials"
        ON testimonials FOR INSERT
        WITH CHECK (status = 'submitted')
    $p$;
  END IF;
END $$;

-- Diviners-manage policy already exists as "testimonials_diviner_all".
-- Admins use the service-role client (bypasses RLS).
