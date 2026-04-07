-- Add updated_at column to testimonial_requests (needed for updated-on filter/sort)
-- Idempotent guard

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'testimonial_requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE testimonial_requests ADD COLUMN updated_at timestamptz;
  END IF;
END $$;
