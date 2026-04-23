-- ============================================================
-- Repair existing community_members.birth_country rows
--
-- For rows where birth_country IS NULL and birth_city ends with a
-- recognized country suffix (e.g. "Dublin, Ireland"), populate
-- birth_country from that suffix.
--
-- Conservative rules:
--   - Never overwrites an existing birth_country.
--   - Only matches a known-country allowlist for suffix parsing.
--   - Includes one targeted repair for a known current account whose
--     city label does not include a country suffix.
--   - Idempotent: safe to re-run.
--   - No DELETEs / no DROPs / no schema changes.
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
    pattern := ', ' || c;
    UPDATE community_members
    SET birth_country = c
    WHERE birth_country IS NULL
      AND birth_city ILIKE '%' || pattern;
    GET DIAGNOSTICS iter_count = ROW_COUNT;
    updated_count := updated_count + iter_count;
  END LOOP;

  -- Known active PM account whose birth_city lacks a country suffix.
  UPDATE community_members
  SET birth_country = 'India'
  WHERE birth_country IS NULL
    AND lower(email) = 'debasiskar007@gmail.com'
    AND birth_city ILIKE 'Halisahar%';
  GET DIAGNOSTICS iter_count = ROW_COUNT;
  updated_count := updated_count + iter_count;

  RAISE NOTICE 'repair_community_members_birth_country: rows updated = %', updated_count;
END $$;
