-- Seed realistic diviner traffic analytics demo rows.
-- Idempotent: clears only its own seed paths before re-inserting.

DO $$
DECLARE
  v_diviner_ids uuid[];
BEGIN
  SELECT ARRAY(
    SELECT id
    FROM public.diviners
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 3
  )
  INTO v_diviner_ids;

  IF coalesce(array_length(v_diviner_ids, 1), 0) = 0 THEN
    RAISE NOTICE 'No active diviners found; skipping diviner traffic analytics seed.';
    RETURN;
  END IF;

  DELETE FROM public.page_views
  WHERE path LIKE '/seed/diviner-traffic/%';

  INSERT INTO public.page_views (
    diviner_id,
    path,
    referrer,
    user_agent,
    ip_hash,
    source_host,
    traffic_source,
    utm_source,
    utm_medium,
    utm_campaign,
    referral_code,
    attribution_kind,
    affiliate_related,
    advocate_related,
    country_code,
    country_region,
    city,
    created_at
  )
  SELECT
    v_diviner_ids[1],
    '/seed/diviner-traffic/luna-brightwell',
    CASE
      WHEN gs % 6 = 0 THEN 'https://www.google.com/search?q=luna+brightwell'
      WHEN gs % 6 = 1 THEN 'https://www.instagram.com/luna.brightwell'
      WHEN gs % 6 = 2 THEN NULL
      WHEN gs % 6 = 3 THEN 'https://newsletter.astrologypro.com/spring-equinox'
      WHEN gs % 6 = 4 THEN 'https://partner.astrologypro.com/luna'
      ELSE 'https://community.astrologypro.com/diviners'
    END,
    'seed-ua/luna',
    md5('seed-luna-' || gs::text),
    CASE
      WHEN gs % 6 = 0 THEN 'www.google.com'
      WHEN gs % 6 = 1 THEN 'www.instagram.com'
      WHEN gs % 6 = 2 THEN NULL
      WHEN gs % 6 = 3 THEN 'newsletter.astrologypro.com'
      WHEN gs % 6 = 4 THEN 'partner.astrologypro.com'
      ELSE 'community.astrologypro.com'
    END,
    CASE
      WHEN gs % 6 = 0 THEN 'organic_search'
      WHEN gs % 6 = 1 THEN 'social'
      WHEN gs % 6 = 2 THEN 'direct'
      WHEN gs % 6 = 3 THEN 'email'
      WHEN gs % 6 = 4 THEN 'affiliate'
      ELSE 'referral'
    END,
    CASE WHEN gs % 6 = 3 THEN 'newsletter' WHEN gs % 6 = 4 THEN 'affiliate-network' ELSE NULL END,
    CASE WHEN gs % 6 = 3 THEN 'email' WHEN gs % 6 = 4 THEN 'affiliate' ELSE NULL END,
    CASE WHEN gs % 6 IN (3,4) THEN 'seed-q2-launch' ELSE NULL END,
    CASE WHEN gs % 6 = 4 THEN 'aff-seed-luna' ELSE NULL END,
    CASE WHEN gs % 6 = 4 THEN 'affiliate' ELSE 'organic' END,
    (gs % 6 = 4),
    false,
    CASE
      WHEN gs % 5 = 0 THEN 'US'
      WHEN gs % 5 = 1 THEN 'GB'
      WHEN gs % 5 = 2 THEN 'IN'
      WHEN gs % 5 = 3 THEN 'CA'
      ELSE 'BR'
    END,
    CASE
      WHEN gs % 5 = 0 THEN 'NY'
      WHEN gs % 5 = 1 THEN 'LND'
      WHEN gs % 5 = 2 THEN 'WB'
      WHEN gs % 5 = 3 THEN 'ON'
      ELSE 'SP'
    END,
    CASE
      WHEN gs % 5 = 0 THEN 'New York'
      WHEN gs % 5 = 1 THEN 'London'
      WHEN gs % 5 = 2 THEN 'Kolkata'
      WHEN gs % 5 = 3 THEN 'Toronto'
      ELSE 'Sao Paulo'
    END,
    now() - ((gs % 30) || ' days')::interval - ((gs % 24) || ' hours')::interval
  FROM generate_series(1, 90) gs

  UNION ALL

  SELECT
    v_diviner_ids[least(2, array_length(v_diviner_ids, 1))],
    '/seed/diviner-traffic/sol-ashara',
    CASE
      WHEN gs % 5 = 0 THEN 'https://www.google.com/search?q=sol+ashara'
      WHEN gs % 5 = 1 THEN 'https://www.facebook.com/solashara'
      WHEN gs % 5 = 2 THEN 'https://advocate.astrologypro.com/refer'
      WHEN gs % 5 = 3 THEN NULL
      ELSE 'https://m.youtube.com/watch?v=seed-sol'
    END,
    'seed-ua/sol',
    md5('seed-sol-' || gs::text),
    CASE
      WHEN gs % 5 = 0 THEN 'www.google.com'
      WHEN gs % 5 = 1 THEN 'www.facebook.com'
      WHEN gs % 5 = 2 THEN 'advocate.astrologypro.com'
      WHEN gs % 5 = 3 THEN NULL
      ELSE 'm.youtube.com'
    END,
    CASE
      WHEN gs % 5 = 0 THEN 'organic_search'
      WHEN gs % 5 = 1 THEN 'social'
      WHEN gs % 5 = 2 THEN 'advocate'
      WHEN gs % 5 = 3 THEN 'direct'
      ELSE 'social'
    END,
    CASE WHEN gs % 5 = 2 THEN 'advocate-program' ELSE NULL END,
    CASE WHEN gs % 5 = 2 THEN 'advocate' ELSE NULL END,
    CASE WHEN gs % 5 = 2 THEN 'seed-advocate-drive' ELSE NULL END,
    CASE WHEN gs % 5 = 2 THEN 'adv-seed-sol' ELSE NULL END,
    CASE WHEN gs % 5 = 2 THEN 'advocate' ELSE 'organic' END,
    false,
    (gs % 5 = 2),
    CASE
      WHEN gs % 4 = 0 THEN 'US'
      WHEN gs % 4 = 1 THEN 'CA'
      WHEN gs % 4 = 2 THEN 'AU'
      ELSE 'IN'
    END,
    CASE
      WHEN gs % 4 = 0 THEN 'CA'
      WHEN gs % 4 = 1 THEN 'BC'
      WHEN gs % 4 = 2 THEN 'NSW'
      ELSE 'DL'
    END,
    CASE
      WHEN gs % 4 = 0 THEN 'Los Angeles'
      WHEN gs % 4 = 1 THEN 'Vancouver'
      WHEN gs % 4 = 2 THEN 'Sydney'
      ELSE 'New Delhi'
    END,
    now() - ((gs % 21) || ' days')::interval - (((gs * 2) % 24) || ' hours')::interval
  FROM generate_series(1, 55) gs

  UNION ALL

  SELECT
    v_diviner_ids[least(3, array_length(v_diviner_ids, 1))],
    '/seed/diviner-traffic/orion-vale',
    CASE
      WHEN gs % 4 = 0 THEN NULL
      WHEN gs % 4 = 1 THEN 'https://www.bing.com/search?q=orion+vale+astrology'
      WHEN gs % 4 = 2 THEN 'https://x.com/orionvale'
      ELSE 'https://affiliate.astrologypro.com/orion'
    END,
    'seed-ua/orion',
    md5('seed-orion-' || gs::text),
    CASE
      WHEN gs % 4 = 0 THEN NULL
      WHEN gs % 4 = 1 THEN 'www.bing.com'
      WHEN gs % 4 = 2 THEN 'x.com'
      ELSE 'affiliate.astrologypro.com'
    END,
    CASE
      WHEN gs % 4 = 0 THEN 'direct'
      WHEN gs % 4 = 1 THEN 'organic_search'
      WHEN gs % 4 = 2 THEN 'social'
      ELSE 'affiliate'
    END,
    CASE WHEN gs % 4 = 3 THEN 'affiliate-network' ELSE NULL END,
    CASE WHEN gs % 4 = 3 THEN 'affiliate' ELSE NULL END,
    CASE WHEN gs % 4 = 3 THEN 'seed-evergreen-affiliate' ELSE NULL END,
    CASE WHEN gs % 4 = 3 THEN 'aff-seed-orion' ELSE NULL END,
    CASE WHEN gs % 4 = 3 THEN 'affiliate' ELSE 'organic' END,
    (gs % 4 = 3),
    false,
    CASE
      WHEN gs % 3 = 0 THEN 'US'
      WHEN gs % 3 = 1 THEN 'GB'
      ELSE 'DE'
    END,
    CASE
      WHEN gs % 3 = 0 THEN 'TX'
      WHEN gs % 3 = 1 THEN 'MAN'
      ELSE 'BE'
    END,
    CASE
      WHEN gs % 3 = 0 THEN 'Austin'
      WHEN gs % 3 = 1 THEN 'Manchester'
      ELSE 'Berlin'
    END,
    now() - ((gs % 14) || ' days')::interval - (((gs * 3) % 24) || ' hours')::interval
  FROM generate_series(1, 28) gs;
END $$;
