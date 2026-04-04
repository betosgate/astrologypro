-- Expose auth user info to service_role via a SECURITY DEFINER function.
-- This avoids the 1 000-per-page limit of the Auth Admin API and lets us
-- fetch all user emails + ban status in one fast SQL query.

CREATE OR REPLACE FUNCTION public.get_auth_users_info()
RETURNS TABLE(user_id uuid, email text, banned_until timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, banned_until FROM auth.users;
$$;

-- Only service_role may call this function
REVOKE EXECUTE ON FUNCTION public.get_auth_users_info() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_auth_users_info() TO service_role;
