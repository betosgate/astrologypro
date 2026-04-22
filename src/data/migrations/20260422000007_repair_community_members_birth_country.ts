// Bundled mirror of
// supabase/migrations/20260422000007_repair_community_members_birth_country.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via the
// admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Purpose: one-time data repair for community_members rows where
// birth_country IS NULL and birth_city ends with a recognized country name
// (e.g. "Dublin, Ireland"). Never overwrites an existing birth_country;
// ambiguous labels are skipped, not guessed. Includes one targeted repair
// for the known active PM account whose birth_city lacks a country suffix.
// Safe to re-run.

export const MIGRATION_SQL = `
DO $$
DECLARE
  country_list TEXT[] := ARRAY[
    'United States of America',
    'United Kingdom',
    'United Arab Emirates',
    'New Zealand',
    'South Africa',
    'South Korea',
    'Saudi Arabia',
    'Puerto Rico',
    'Hong Kong',
    'Czech Republic',
    'Sri Lanka',
    'Dominican Republic',
    'Trinidad and Tobago',
    'United States',
    'USA',
    'UK',
    'UAE',
    'Australia',
    'Austria',
    'Argentina',
    'Belgium',
    'Brazil',
    'Bulgaria',
    'Canada',
    'Chile',
    'China',
    'Colombia',
    'Croatia',
    'Denmark',
    'Ecuador',
    'Egypt',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Kenya',
    'Malaysia',
    'Mexico',
    'Morocco',
    'Nepal',
    'Netherlands',
    'Nigeria',
    'Norway',
    'Pakistan',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Serbia',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'Thailand',
    'Turkey',
    'Ukraine',
    'Venezuela',
    'Vietnam'
  ];
  c TEXT;
  pattern TEXT;
  updated_count INT := 0;
  iter_count INT;
BEGIN
  FOREACH c IN ARRAY country_list LOOP
    pattern := ', ' || c;
    UPDATE community_members
    SET birth_country = c
    WHERE birth_country IS NULL
      AND birth_city ILIKE '%' || pattern;
    GET DIAGNOSTICS iter_count = ROW_COUNT;
    updated_count := updated_count + iter_count;
  END LOOP;

  UPDATE community_members
  SET birth_country = 'India'
  WHERE birth_country IS NULL
    AND lower(email) = 'debasiskar007@gmail.com'
    AND birth_city ILIKE 'Halisahar%';
  GET DIAGNOSTICS iter_count = ROW_COUNT;
  updated_count := updated_count + iter_count;

  RAISE NOTICE 'repair_community_members_birth_country: rows updated = %', updated_count;
END $$;
`;
