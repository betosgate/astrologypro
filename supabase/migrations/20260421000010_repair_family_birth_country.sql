-- ============================================================
-- Task 04: Repair existing family birth_country rows
--
-- For rows where birth_country IS NULL and birth_city ends with a
-- recognized country suffix (e.g. "Miami, FL, United States of America"),
-- extract the final comma-separated segment and populate birth_country.
--
-- Conservative rules:
--   - Never overwrites an existing birth_country.
--   - Only matches a known-country allowlist — ambiguous labels are
--     skipped, not guessed.
--   - Idempotent: re-running produces zero updates on the 2nd run.
--   - No DELETEs / no DROPs / no schema changes.
--
-- build: 2026-04-21
-- ============================================================

DO $$
DECLARE
  -- Ordered longer-first so "United States of America" wins over
  -- "United States" etc.
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
    -- Match an optional ", " then the country at end of string, case-insensitive.
    pattern := ', ' || c;
    UPDATE community_family_members
    SET birth_country = c
    WHERE birth_country IS NULL
      AND birth_city ILIKE '%' || pattern;
    GET DIAGNOSTICS iter_count = ROW_COUNT;
    updated_count := updated_count + iter_count;
  END LOOP;

  RAISE NOTICE 'repair_family_birth_country: rows updated = %', updated_count;
END $$;
