-- Soft-delete archive table for user records
CREATE TABLE IF NOT EXISTS deleted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_role VARCHAR(50) NOT NULL,
  original_row_id UUID NOT NULL,
  original_table VARCHAR(50) NOT NULL,
  original_data JSONB NOT NULL,
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  restored_at TIMESTAMPTZ,
  restored_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_user_id ON deleted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at ON deleted_users(deleted_at DESC);
