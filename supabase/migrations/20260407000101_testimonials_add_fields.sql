-- Migration: add tracking fields to testimonials and ensure requests [id] route exists
-- Idempotent: all changes are guarded with IF NOT EXISTS

DO $$
BEGIN
  -- Add requested_to_email to testimonials (email of who the testimonial was requested from)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonials' AND column_name = 'requested_to_email'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN requested_to_email text;
  END IF;

  -- Add requested_to_phone_no to testimonials
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonials' AND column_name = 'requested_to_phone_no'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN requested_to_phone_no text;
  END IF;

  -- Add added_by_name to testimonials (display name of admin/diviner who added)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonials' AND column_name = 'added_by_name'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN added_by_name text;
  END IF;

  -- Add added_by_id to testimonials (uuid of the user who added the testimonial)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonials' AND column_name = 'added_by_id'
  ) THEN
    ALTER TABLE testimonials ADD COLUMN added_by_id uuid;
  END IF;

  -- Add updated_at to testimonial_requests (needed for updated-on filter)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonial_requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE testimonial_requests ADD COLUMN updated_at timestamptz;
  END IF;
END $$;
