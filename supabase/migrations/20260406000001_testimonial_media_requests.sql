-- Add media columns to testimonials
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS audio JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS video JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Testimonial requests table
CREATE TABLE IF NOT EXISTS testimonial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_to_name VARCHAR(100) NOT NULL,
  requested_to_email VARCHAR(200) NOT NULL,
  requested_to_phone_no VARCHAR(30),
  testimonial_for UUID REFERENCES diviners(id) ON DELETE SET NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'declined')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonial_requests_status ON testimonial_requests(status);
CREATE INDEX IF NOT EXISTS idx_testimonial_requests_created_at ON testimonial_requests(created_at DESC);
