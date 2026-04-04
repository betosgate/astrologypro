-- Look up auth user info for a specific set of user IDs.
-- Called from the admin users page after profile rows are fetched,
-- so we only query auth.users for the IDs we actually need — no row-limit issues.

CREATE OR REPLACE FUNCTION public.get_auth_users_by_ids(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text, banned_until timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, banned_until
  FROM auth.users
  WHERE id = ANY(user_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_users_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_auth_users_by_ids(uuid[]) TO service_role;
