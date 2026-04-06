-- ============================================================
-- Lantern: Multi-tenant organization support
-- ============================================================

-- ========== 1. New tables ==========

-- ---------- organizations ----------
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  channel_email boolean DEFAULT true,
  channel_slack text,
  channel_discord text,
  digest_frequency text DEFAULT 'monthly',
  max_competitors int NOT NULL DEFAULT 3,
  max_members int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ---------- organization_members ----------
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_members_org_id ON organization_members (org_id);
CREATE INDEX idx_org_members_user_id ON organization_members (user_id);

-- ---------- invitations ----------
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_invitations_pending
  ON invitations (org_id, email) WHERE status = 'pending';
CREATE UNIQUE INDEX idx_invitations_token ON invitations (token);

-- ---------- user_preferences ----------
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ========== 2. Modify existing tables ==========

-- Add org_id to competitors
ALTER TABLE competitors ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_competitors_org_id ON competitors (org_id);

-- Add org_id to competitor_snapshots
ALTER TABLE competitor_snapshots ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_snapshots_org_id ON competitor_snapshots (org_id);

-- Add org_id to insights
ALTER TABLE insights ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_insights_org_id ON insights (org_id);

-- Replace subscriber_id with org_id on digests
DROP INDEX IF EXISTS idx_digests_subscriber_id;
ALTER TABLE digests DROP COLUMN IF EXISTS subscriber_id CASCADE;
ALTER TABLE digests ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_digests_org_id ON digests (org_id);

-- Add org_id to delivery_logs
ALTER TABLE delivery_logs ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_delivery_logs_org_id ON delivery_logs (org_id);

-- ========== 3. Drop subscribers table ==========

DROP POLICY IF EXISTS "Users can read own subscriber record" ON subscribers;
DROP POLICY IF EXISTS "Users can update own subscriber record" ON subscribers;
DROP TABLE IF EXISTS subscribers;

-- ========== 4. RLS helper functions ==========

CREATE OR REPLACE FUNCTION is_org_member(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_org_owner(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- Note: Owner membership is created explicitly in the API route (POST /api/organizations)
-- because the service role client bypasses auth context, making auth.uid() unavailable in triggers.

-- ========== 6. RLS policies ==========

-- --- organizations ---
DROP POLICY IF EXISTS "Competitors are readable by authenticated users" ON competitors;

CREATE POLICY "Org members can read their organization"
  ON organizations FOR SELECT
  USING (is_org_member(id));

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Org owners can update their organization"
  ON organizations FOR UPDATE
  USING (is_org_owner(id));

CREATE POLICY "Org owners can delete their organization"
  ON organizations FOR DELETE
  USING (is_org_owner(id));

-- --- organization_members ---
CREATE POLICY "Org members can view membership"
  ON organization_members FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Org owners can add members"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_owner(org_id));

CREATE POLICY "Org owners can update members"
  ON organization_members FOR UPDATE
  USING (is_org_owner(org_id));

CREATE POLICY "Org owners can remove members"
  ON organization_members FOR DELETE
  USING (is_org_owner(org_id));

-- --- invitations ---
CREATE POLICY "Org owners and invitees can view invitations"
  ON invitations FOR SELECT
  USING (is_org_owner(org_id) OR email = auth.jwt()->>'email');

CREATE POLICY "Org owners can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (is_org_owner(org_id));

CREATE POLICY "Org owners can update invitations"
  ON invitations FOR UPDATE
  USING (is_org_owner(org_id));

CREATE POLICY "Org owners can delete invitations"
  ON invitations FOR DELETE
  USING (is_org_owner(org_id));

-- --- user_preferences ---
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- --- competitors (replace old policy) ---
CREATE POLICY "Org members can read competitors"
  ON competitors FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Org owners can add competitors"
  ON competitors FOR INSERT
  WITH CHECK (is_org_owner(org_id));

CREATE POLICY "Org owners can update competitors"
  ON competitors FOR UPDATE
  USING (is_org_owner(org_id));

CREATE POLICY "Org owners can delete competitors"
  ON competitors FOR DELETE
  USING (is_org_owner(org_id));

-- --- competitor_snapshots (replace old policy) ---
DROP POLICY IF EXISTS "Snapshots are readable by authenticated users" ON competitor_snapshots;

CREATE POLICY "Org members can read snapshots"
  ON competitor_snapshots FOR SELECT
  USING (is_org_member(org_id));

-- --- insights (replace old policy) ---
DROP POLICY IF EXISTS "Insights are readable by authenticated users" ON insights;

CREATE POLICY "Org members can read insights"
  ON insights FOR SELECT
  USING (is_org_member(org_id));

-- --- digests (replace old policy) ---
DROP POLICY IF EXISTS "Users can read own digests" ON digests;

CREATE POLICY "Org members can read digests"
  ON digests FOR SELECT
  USING (is_org_member(org_id));

-- --- delivery_logs (replace old policy) ---
DROP POLICY IF EXISTS "Users can read own delivery logs" ON delivery_logs;

CREATE POLICY "Org members can read delivery logs"
  ON delivery_logs FOR SELECT
  USING (is_org_member(org_id));
