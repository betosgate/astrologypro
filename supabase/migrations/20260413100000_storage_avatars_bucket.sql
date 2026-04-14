-- Create the "all-frontend-assets" storage bucket (project-wide asset bucket).
-- Used for avatars, covers, tarot cards, testimonials, media, etc.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'all-frontend-assets',
  'all-frontend-assets',
  true,
  52428800  -- 50 MB
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload assets
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'all-frontend-assets');

-- Allow authenticated users to update (upsert) their assets
CREATE POLICY "Authenticated users can update assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'all-frontend-assets');

-- Allow public read access (bucket is public)
CREATE POLICY "Public read access for all-frontend-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'all-frontend-assets');
