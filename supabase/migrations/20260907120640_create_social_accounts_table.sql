/*
# Create social_accounts table (multi-user, owner-scoped)

1. New Tables
- `social_accounts`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, defaults to auth.uid())
  - `platform` (text, e.g. 'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'reddit')
  - `handle` (text, the account handle or username, e.g. '@mybrand')
  - `url` (text, full URL to the social media profile/page)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `social_accounts`.
- Owner-scoped CRUD: each authenticated user can only access their own social account rows.
- user_id defaults to auth.uid() so client inserts work without passing it.
*/

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text NOT NULL DEFAULT '',
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_social_accounts" ON social_accounts;
CREATE POLICY "select_own_social_accounts" ON social_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_social_accounts" ON social_accounts;
CREATE POLICY "insert_own_social_accounts" ON social_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_social_accounts" ON social_accounts;
CREATE POLICY "update_own_social_accounts" ON social_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_social_accounts" ON social_accounts;
CREATE POLICY "delete_own_social_accounts" ON social_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
