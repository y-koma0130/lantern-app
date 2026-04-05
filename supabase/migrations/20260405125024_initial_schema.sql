-- ============================================================
-- Lantern initial schema
-- ============================================================

-- ---------- subscribers ----------
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  channel_email boolean DEFAULT true,
  channel_slack text,
  channel_discord text,
  competitor_ids uuid[] DEFAULT '{}',
  digest_frequency text DEFAULT 'weekly',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriber record"
  ON subscribers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own subscriber record"
  ON subscribers FOR UPDATE
  USING (auth.uid() = id);

-- ---------- competitors ----------
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text NOT NULL,
  g2_url text,
  github_org text,
  linkedin_slug text,
  crunchbase_slug text,
  niche text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitors are readable by authenticated users"
  ON competitors FOR SELECT
  USING (auth.role() = 'authenticated');

-- ---------- competitor_snapshots ----------
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  source text NOT NULL,
  raw_data jsonb NOT NULL DEFAULT '{}',
  collected_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Snapshots are readable by authenticated users"
  ON competitor_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_snapshots_competitor_id ON competitor_snapshots (competitor_id);
CREATE INDEX idx_snapshots_collected_at ON competitor_snapshots (collected_at DESC);

-- ---------- insights ----------
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES competitor_snapshots(id) ON DELETE CASCADE,
  type text NOT NULL,
  importance_score int NOT NULL DEFAULT 0,
  summary text NOT NULL,
  diff_detail jsonb NOT NULL DEFAULT '{}',
  week_of date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights are readable by authenticated users"
  ON insights FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_insights_competitor_id ON insights (competitor_id);
CREATE INDEX idx_insights_week_of ON insights (week_of);
CREATE INDEX idx_insights_importance ON insights (importance_score DESC);

-- ---------- digests ----------
CREATE TABLE IF NOT EXISTS digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  week_of date NOT NULL,
  content_md text NOT NULL,
  content_html text NOT NULL,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own digests"
  ON digests FOR SELECT
  USING (auth.uid() = subscriber_id);

CREATE INDEX idx_digests_subscriber_id ON digests (subscriber_id);
CREATE INDEX idx_digests_week_of ON digests (week_of);

-- ---------- delivery_logs ----------
CREATE TABLE IF NOT EXISTS delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id uuid NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own delivery logs"
  ON delivery_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digests
      WHERE digests.id = delivery_logs.digest_id
        AND digests.subscriber_id = auth.uid()
    )
  );

CREATE INDEX idx_delivery_logs_digest_id ON delivery_logs (digest_id);
CREATE INDEX idx_delivery_logs_status ON delivery_logs (status);

-- Service role key bypasses RLS, so agents need no additional write policies.
