CREATE TABLE IF NOT EXISTS dashboard_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_scope text NOT NULL DEFAULT 'perennial_mandalism'
    CHECK (dashboard_scope IN ('perennial_mandalism')),
  item_mode text NOT NULL DEFAULT 'native'
    CHECK (item_mode IN ('native', 'source_linked')),
  category text NOT NULL
    CHECK (category IN ('blog', 'announcement', 'calendar_event', 'system_video', 'youtube_video', 'document')),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  cta_label text,
  cta_url text,
  source_table text
    CHECK (source_table IN ('blog_posts', 'calendar_events', 'mandalism_content')),
  source_id uuid,
  publish_at timestamptz NOT NULL DEFAULT now(),
  expire_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  is_pinned boolean NOT NULL DEFAULT false,
  manual_sort_weight integer NOT NULL DEFAULT 0,
  audience_scope text NOT NULL DEFAULT 'perennial_mandalism'
    CHECK (audience_scope IN ('all_members', 'perennial_mandalism', 'mystery_school')),
  publication_state text NOT NULL DEFAULT 'draft'
    CHECK (publication_state IN ('draft', 'scheduled', 'published', 'expired', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expire_at IS NULL OR expire_at > publish_at),
  CHECK (
    (item_mode = 'native' AND source_table IS NULL AND source_id IS NULL)
    OR
    (item_mode = 'source_linked' AND source_table IS NOT NULL AND source_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS dashboard_content_items_scope_publish_idx
  ON dashboard_content_items (dashboard_scope, publish_at DESC);

CREATE INDEX IF NOT EXISTS dashboard_content_items_category_publish_idx
  ON dashboard_content_items (category, publish_at DESC);

CREATE INDEX IF NOT EXISTS dashboard_content_items_state_publish_idx
  ON dashboard_content_items (publication_state, publish_at DESC);

CREATE INDEX IF NOT EXISTS dashboard_content_items_active_release_idx
  ON dashboard_content_items (publish_at DESC, manual_sort_weight DESC, created_at DESC)
  WHERE is_active = true
    AND publication_state IN ('scheduled', 'published');

ALTER TABLE dashboard_content_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dashboard_content_items'
      AND policyname = 'service_role_full_access_dashboard_content_items'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_full_access_dashboard_content_items"
      ON dashboard_content_items
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role')
    $policy$;
  END IF;
END $$;

WITH seeded_blog AS (
  INSERT INTO blog_posts (
    title,
    slug,
    excerpt,
    content,
    category,
    image_url,
    is_published,
    published_at
  )
  VALUES (
    'Understanding Perennial Mandalism',
    'understanding-perennial-mandalism',
    'A foundational guide to the philosophy, rhythm, and practice behind Perennial Mandalism.',
    'Seeded launch article for the Perennial Mandalism dashboard feed.',
    'Perennial Mandalism',
    'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1200&q=80',
    true,
    now() - interval '10 days'
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    is_published = EXCLUDED.is_published,
    published_at = EXCLUDED.published_at,
    updated_at = now()
  RETURNING id
),
seeded_event AS (
  INSERT INTO calendar_events (
    title,
    description,
    category,
    start_at,
    end_at,
    display_for,
    priority,
    is_active
  )
  VALUES (
    'Monthly Perennial Orientation',
    'A live orientation for new members to understand the dashboard, study rhythm, and upcoming events.',
    'orientation',
    now() + interval '6 days',
    now() + interval '6 days 90 minutes',
    'members',
    5,
    true
  )
  RETURNING id
),
existing_event AS (
  SELECT id
  FROM seeded_event
  UNION ALL
  SELECT id
  FROM calendar_events
  WHERE title = 'Monthly Perennial Orientation'
  LIMIT 1
),
seeded_video AS (
  INSERT INTO mandalism_content (
    content_type,
    title,
    description,
    url,
    access_control,
    priority,
    is_published,
    content_thumbnail_url,
    duration_label
  )
  VALUES (
    'video',
    'Platform Walkthrough',
    'A guided walkthrough of the Perennial Mandalism member dashboard.',
    'https://cdn.astrologypro.com/perennial/platform-walkthrough.mp4',
    'members',
    10,
    true,
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    '08:14'
  )
  RETURNING id
),
existing_video AS (
  SELECT id
  FROM seeded_video
  UNION ALL
  SELECT id
  FROM mandalism_content
  WHERE title = 'Platform Walkthrough'
  LIMIT 1
),
seeded_document AS (
  INSERT INTO mandalism_content (
    content_type,
    title,
    description,
    pdf_url,
    access_control,
    priority,
    is_published,
    content_thumbnail_url
  )
  VALUES (
    'document',
    'Member Welcome Guide',
    'A quick-start handbook for navigating the first month of Perennial Mandalism.',
    'https://cdn.astrologypro.com/perennial/member-welcome-guide.pdf',
    'members',
    20,
    true,
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'
  )
  RETURNING id
),
existing_document AS (
  SELECT id
  FROM seeded_document
  UNION ALL
  SELECT id
  FROM mandalism_content
  WHERE title = 'Member Welcome Guide'
  LIMIT 1
)
INSERT INTO dashboard_content_items (
  dashboard_scope,
  item_mode,
  category,
  title,
  description,
  thumbnail_url,
  cta_label,
  cta_url,
  source_table,
  source_id,
  publish_at,
  expire_at,
  is_active,
  is_pinned,
  manual_sort_weight,
  audience_scope,
  publication_state,
  metadata
)
SELECT *
FROM (
  SELECT
    'perennial_mandalism'::text,
    'source_linked'::text,
    'blog'::text,
    'Understanding Perennial Mandalism'::text,
    'A foundational guide to the philosophy, rhythm, and practice behind Perennial Mandalism.'::text,
    'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1200&q=80'::text,
    'Read Article'::text,
    NULL::text,
    'blog_posts'::text,
    (SELECT id FROM seeded_blog),
    now() - interval '9 days',
    NULL::timestamptz,
    true,
    true,
    100,
    'perennial_mandalism'::text,
    'published'::text,
    jsonb_build_object('estimated_read_minutes', 6)

  UNION ALL

  SELECT
    'perennial_mandalism',
    'native',
    'announcement',
    'Welcome to Your Sacred Dashboard',
    'Start with your profile, review this month''s guidance, and reserve time for the next community gathering.',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    'Open Dashboard',
    '/community',
    NULL,
    NULL,
    now() - interval '2 days',
    NULL,
    true,
    true,
    90,
    'perennial_mandalism',
    'published',
    jsonb_build_object('accent', 'gold')

  UNION ALL

  SELECT
    'perennial_mandalism',
    'source_linked',
    'calendar_event',
    'Monthly Perennial Orientation',
    'Join the next live orientation for new members and get the full dashboard walkthrough.',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    'View Event',
    NULL,
    'calendar_events',
    (SELECT id FROM existing_event),
    now() - interval '1 day',
    NULL,
    true,
    false,
    70,
    'perennial_mandalism',
    'published',
    '{}'::jsonb

  UNION ALL

  SELECT
    'perennial_mandalism',
    'source_linked',
    'system_video',
    'Platform Walkthrough',
    'Learn where everything lives in the Perennial Mandalism dashboard in under ten minutes.',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    'Watch Video',
    NULL,
    'mandalism_content',
    (SELECT id FROM existing_video),
    now() - interval '12 hours',
    NULL,
    true,
    false,
    60,
    'perennial_mandalism',
    'published',
    jsonb_build_object('duration_label', '08:14')

  UNION ALL

  SELECT
    'perennial_mandalism',
    'native',
    'youtube_video',
    'Featured Teaching: Daily Rhythm and Spiritual Practice',
    'A featured YouTube teaching chosen for this month''s Perennial Mandalism members.',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    'Watch on YouTube',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL,
    NULL,
    now() + interval '3 days',
    NULL,
    true,
    false,
    50,
    'perennial_mandalism',
    'scheduled',
    jsonb_build_object('youtube_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')

  UNION ALL

  SELECT
    'perennial_mandalism',
    'source_linked',
    'document',
    'Member Welcome Guide',
    'Keep the handbook close as you set up your first month of study and practice.',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    'Open Guide',
    NULL,
    'mandalism_content',
    (SELECT id FROM existing_document),
    now() + interval '8 days',
    NULL,
    true,
    false,
    40,
    'perennial_mandalism',
    'scheduled',
    '{}'::jsonb
) seeded (
  dashboard_scope,
  item_mode,
  category,
  title,
  description,
  thumbnail_url,
  cta_label,
  cta_url,
  source_table,
  source_id,
  publish_at,
  expire_at,
  is_active,
  is_pinned,
  manual_sort_weight,
  audience_scope,
  publication_state,
  metadata
)
WHERE NOT EXISTS (
  SELECT 1
  FROM dashboard_content_items dci
  WHERE dci.dashboard_scope = seeded.dashboard_scope
    AND dci.title = seeded.title
    AND dci.category = seeded.category
);
