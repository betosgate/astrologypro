// Bundled mirror of supabase/migrations/20260430000001_search_auth_users_by_email_fn.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- Look up auth user IDs by email for admin search screens.
-- Restricted to service_role because it reads auth.users.

CREATE OR REPLACE FUNCTION public.search_auth_user_ids_by_email(
  email_query text,
  max_rows integer DEFAULT 1000
)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM auth.users
  WHERE email ILIKE (
    '%' ||
    replace(
      replace(
        replace(coalesce(email_query, ''), E'\\\\', E'\\\\\\\\'),
        '%',
        E'\\\\%'
      ),
      '_',
      E'\\\\_'
    ) ||
    '%'
  ) ESCAPE E'\\\\'
  ORDER BY email
  LIMIT greatest(1, least(coalesce(max_rows, 1000), 5000));
$$;

REVOKE EXECUTE ON FUNCTION public.search_auth_user_ids_by_email(text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_auth_user_ids_by_email(text, integer)
  TO service_role;
`;
