-- Add login_method to user_login_logs so we can distinguish how the user authenticated.
-- Values: 'password' | 'magic_link' | 'oauth' | 'sso'
ALTER TABLE user_login_logs
  ADD COLUMN IF NOT EXISTS login_method TEXT;
