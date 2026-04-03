-- Fix testimonials: rename is_featured → featured, add booking_id for dedup

ALTER TABLE testimonials RENAME COLUMN is_featured TO featured;

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_testimonials_booking ON testimonials(booking_id);
