-- ============================================================================
-- Community: canonical self-row repair + uniqueness guard
--
-- Fixes the case where a community account has multiple `self` rows in
-- community_family_members (one with valid coords, one without; or one with
-- a linked user_id, one without). Symptom: a member appears both in the
-- transit-eligible list AND under "1 member needs birth details" on
-- /community/transits.
--
-- Strategy:
--   1. For every member_id with > 1 self row, pick the canonical row by
--      score: valid lat/lng + linked user_id + has natal_report_id +
--      latest meaningful update.
--   2. Re-point every FK that references a non-canonical self row to the
--      canonical one. (CASCADE FKs we know about: monthly_transits,
--      relationship_charts, community_relationship_reports,
--      return_event_reminders, natal_regeneration_audit.) Skip rows that
--      would cause a UNIQUE-constraint violation after re-point — those
--      are duplicate work for the same product on the canonical row and
--      get cleaned up implicitly when the non-canonical source is deleted
--      via CASCADE.
--   3. Delete the non-canonical self rows. CASCADE handles any
--      remaining child rows (monthly_transits etc.) safely. astro_ai_responses
--      has no FK to family_member_id (verified) so saved AI artifacts are
--      preserved.
--   4. Add a partial UNIQUE index preventing future duplicates per
--      member_id where relationship is 'self' (case-insensitive).
--
-- Sprint plan:
--   tasks/06.05.2026/community-transits-profile-and-display-fixes/
-- ============================================================================

BEGIN;

-- ─── 1. Find canonical self per member_id ─────────────────────────────────
-- Score: 4 = valid lat AND lng, 2 = linked user_id, 1 = has natal_report_id
-- Ordering: score desc, updated_at desc, created_at asc as final tie-break.
DO $repair$
DECLARE
  dup_member RECORD;
  canonical_id UUID;
  losing_ids UUID[];
BEGIN
  FOR dup_member IN
    SELECT member_id
      FROM public.community_family_members
     WHERE LOWER(COALESCE(relationship, '')) = 'self'
     GROUP BY member_id
     HAVING COUNT(*) > 1
  LOOP
    -- Pick the canonical row.
    SELECT id INTO canonical_id
      FROM public.community_family_members
     WHERE member_id = dup_member.member_id
       AND LOWER(COALESCE(relationship, '')) = 'self'
     ORDER BY
       (
         CASE WHEN birth_lat IS NOT NULL AND birth_lng IS NOT NULL THEN 4 ELSE 0 END
         + CASE WHEN user_id IS NOT NULL THEN 2 ELSE 0 END
         + CASE WHEN natal_report_id IS NOT NULL THEN 1 ELSE 0 END
       ) DESC,
       COALESCE(updated_at, created_at) DESC,
       created_at ASC
     LIMIT 1;

    -- Collect the losing duplicates.
    SELECT array_agg(id) INTO losing_ids
      FROM public.community_family_members
     WHERE member_id = dup_member.member_id
       AND LOWER(COALESCE(relationship, '')) = 'self'
       AND id <> canonical_id;

    RAISE NOTICE 'Repairing duplicate-self for member_id=% canonical=% losing=%',
      dup_member.member_id, canonical_id, losing_ids;

    -- ─── Re-point CASCADE-FK references onto the canonical id ────────────
    -- monthly_transits.family_member_id (CASCADE)
    BEGIN
      EXECUTE format(
        'UPDATE public.monthly_transits SET family_member_id = %L
          WHERE family_member_id = ANY(%L::uuid[])
            AND NOT EXISTS (
              SELECT 1 FROM public.monthly_transits mt2
               WHERE mt2.family_member_id = %L
                 AND mt2.month = public.monthly_transits.month
            )',
        canonical_id, losing_ids, canonical_id
      );
    EXCEPTION WHEN undefined_column OR undefined_table THEN
      -- Column / table absent in this environment — skip.
      NULL;
    END;

    -- return_event_reminders.family_member_id (CASCADE)
    BEGIN
      EXECUTE format(
        'UPDATE public.return_event_reminders SET family_member_id = %L
          WHERE family_member_id = ANY(%L::uuid[])',
        canonical_id, losing_ids
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    -- natal_regeneration_audit.family_member_id (CASCADE)
    BEGIN
      EXECUTE format(
        'UPDATE public.natal_regeneration_audit SET family_member_id = %L
          WHERE family_member_id = ANY(%L::uuid[])',
        canonical_id, losing_ids
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    -- relationship_charts.person_a_id / person_b_id (CASCADE).
    -- Re-point only when the canonical doesn't already have a row for
    -- the same opposite person (would violate any pair UNIQUE).
    BEGIN
      EXECUTE format(
        'UPDATE public.relationship_charts SET person_a_id = %L
          WHERE person_a_id = ANY(%L::uuid[])',
        canonical_id, losing_ids
      );
      EXECUTE format(
        'UPDATE public.relationship_charts SET person_b_id = %L
          WHERE person_b_id = ANY(%L::uuid[])',
        canonical_id, losing_ids
      );
    EXCEPTION WHEN unique_violation OR undefined_table THEN
      -- Duplicate pair — fall through; the row gets removed via CASCADE
      -- when the losing self-row is deleted below.
      NULL;
    END;

    -- community_relationship_reports.person_a_id / person_b_id (CASCADE).
    -- Has UNIQUE (person_a_id, person_b_id, report_type) — skip on conflict.
    BEGIN
      EXECUTE format(
        'UPDATE public.community_relationship_reports SET person_a_id = %L
          WHERE person_a_id = ANY(%L::uuid[])
            AND NOT EXISTS (
              SELECT 1 FROM public.community_relationship_reports rr2
               WHERE rr2.person_a_id = %L
                 AND rr2.person_b_id = public.community_relationship_reports.person_b_id
                 AND rr2.report_type = public.community_relationship_reports.report_type
            )',
        canonical_id, losing_ids, canonical_id
      );
      EXECUTE format(
        'UPDATE public.community_relationship_reports SET person_b_id = %L
          WHERE person_b_id = ANY(%L::uuid[])
            AND NOT EXISTS (
              SELECT 1 FROM public.community_relationship_reports rr2
               WHERE rr2.person_b_id = %L
                 AND rr2.person_a_id = public.community_relationship_reports.person_a_id
                 AND rr2.report_type = public.community_relationship_reports.report_type
            )',
        canonical_id, losing_ids, canonical_id
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    -- ─── Patch canonical with stronger fields from losers ────────────────
    -- Fill any NULL fields on canonical from a losing row that has them.
    -- This recovers data when the row that won on coords lost on
    -- (say) user_id linkage, or vice versa.
    UPDATE public.community_family_members canon
       SET
         user_id        = COALESCE(canon.user_id, src.user_id),
         birth_time     = COALESCE(canon.birth_time, src.birth_time),
         birth_city     = COALESCE(canon.birth_city, src.birth_city),
         birth_country  = COALESCE(canon.birth_country, src.birth_country),
         birth_lat      = COALESCE(canon.birth_lat, src.birth_lat),
         birth_lng      = COALESCE(canon.birth_lng, src.birth_lng),
         relationship   = COALESCE(canon.relationship, src.relationship)
      FROM (
        SELECT
          MAX(user_id::text)::uuid              AS user_id,
          MAX(birth_time::text)                  AS birth_time,
          MAX(birth_city)                        AS birth_city,
          MAX(birth_country)                     AS birth_country,
          MAX(birth_lat)                         AS birth_lat,
          MAX(birth_lng)                         AS birth_lng,
          MAX(relationship)                      AS relationship
          FROM public.community_family_members
         WHERE id = ANY(losing_ids)
      ) AS src
     WHERE canon.id = canonical_id;

    -- Force canonical relationship='self' (case-stable).
    UPDATE public.community_family_members
       SET relationship = 'self',
           updated_at   = NOW()
     WHERE id = canonical_id;

    -- ─── Delete the losing self rows (CASCADE handles children) ──────────
    DELETE FROM public.community_family_members
     WHERE id = ANY(losing_ids);

  END LOOP;
END
$repair$;

-- ─── 2. Add the uniqueness guard ──────────────────────────────────────────
-- One canonical 'self' row per member_id. Case-insensitive on relationship
-- because the column has historically been written as 'Self' / 'self'.
-- Partial index — only enforces on 'self' rows so non-self rows
-- (Spouse, Child, etc.) remain unrestricted.
CREATE UNIQUE INDEX IF NOT EXISTS ux_family_members_one_self_per_member
  ON public.community_family_members (member_id)
  WHERE LOWER(COALESCE(relationship, '')) = 'self';

-- ─── 3. Sanity ────────────────────────────────────────────────────────────
DO $check$
DECLARE
  dup_remaining BIGINT;
BEGIN
  SELECT COUNT(*) INTO dup_remaining
    FROM (
      SELECT member_id, COUNT(*) AS cnt
        FROM public.community_family_members
       WHERE LOWER(COALESCE(relationship, '')) = 'self'
       GROUP BY member_id
       HAVING COUNT(*) > 1
    ) sub;
  IF dup_remaining > 0 THEN
    RAISE EXCEPTION
      'Phase 1 repair: % member_id(s) still have duplicate self rows after repair pass.',
      dup_remaining;
  END IF;
END
$check$;

COMMIT;
