-- Ingress Charts: related insights scoring.
-- Mirrors the legacy MongoDB related insight scoring in PostgreSQL:
-- same location = 100 points, each overlapping tag = 1 point,
-- keep charts where total score > 1.

CREATE OR REPLACE FUNCTION public.find_related_ingress_chart_insights(
  p_chart_id uuid,
  p_mongo_id text DEFAULT NULL,
  p_skip integer DEFAULT 0,
  p_limit integer DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  mongo_id text,
  title text,
  ingress_type text,
  short_description text,
  event_time_period text,
  effective_time_period text,
  validity_end date,
  location_name text,
  author_name text,
  author_email text,
  tags text[],
  location_score integer,
  tags_score integer,
  relevance_score integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target_chart AS (
    SELECT ic.id, ic.location_name, COALESCE(ic.tags, '{}'::text[]) AS tags
    FROM public.ingress_charts ic
    WHERE
      (p_chart_id IS NOT NULL AND ic.id = p_chart_id)
      OR (p_mongo_id IS NOT NULL AND ic.mongo_id = p_mongo_id)
    ORDER BY CASE WHEN p_chart_id IS NOT NULL AND ic.id = p_chart_id THEN 0 ELSE 1 END
    LIMIT 1
  ),
  scored_charts AS (
    SELECT
      ic.id,
      ic.mongo_id,
      ic.title,
      ic.ingress_type,
      COALESCE(ic.short_description, ic.system_interpretation->>'shortDescription') AS short_description,
      ic.event_time_period,
      ic.effective_time_period,
      ic.validity_end,
      ic.location_name,
      ic.author_name,
      ic.author_email,
      COALESCE(ic.tags, '{}'::text[]) AS tags,
      CASE
        WHEN NULLIF(ic.location_name, '') IS NOT NULL
          AND ic.location_name = tc.location_name
        THEN 100
        ELSE 0
      END AS location_score,
      COALESCE(
        cardinality(
          ARRAY(
            SELECT unnest(COALESCE(ic.tags, '{}'::text[]))
            INTERSECT
            SELECT unnest(tc.tags)
          )
        ),
        0
      ) AS tags_score
    FROM public.ingress_charts ic
    CROSS JOIN target_chart tc
    WHERE ic.id <> tc.id
  ),
  filtered AS (
    SELECT
      sc.*,
      (sc.location_score + sc.tags_score) AS relevance_score
    FROM scored_charts sc
    WHERE (sc.location_score + sc.tags_score) > 1
  )
  SELECT
    f.id,
    f.mongo_id,
    f.title,
    f.ingress_type,
    f.short_description,
    f.event_time_period,
    f.effective_time_period,
    f.validity_end,
    f.location_name,
    f.author_name,
    f.author_email,
    f.tags,
    f.location_score,
    f.tags_score,
    f.relevance_score,
    COUNT(*) OVER () AS total_count
  FROM filtered f
  ORDER BY f.relevance_score DESC, f.validity_end DESC NULLS LAST, f.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 6), 1), 24)
  OFFSET GREATEST(COALESCE(p_skip, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.find_related_ingress_chart_insights(uuid, text, integer, integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_related_ingress_chart_insights(uuid, text, integer, integer)
  TO service_role;
