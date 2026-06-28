-- TubePath initial schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  active_channel_id UUID,
  check_in_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Google accounts linked to user
CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_id TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, google_id)
);

-- YouTube channel connections
CREATE TABLE IF NOT EXISTS channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_account_id UUID NOT NULL REFERENCES google_accounts(id) ON DELETE CASCADE,
  youtube_channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'content_owner')),
  content_owner_id TEXT,
  subscriber_count BIGINT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, youtube_channel_id)
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_connection_id UUID NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_connection_id, youtube_video_id)
);

-- Channel-level daily metrics
CREATE TABLE IF NOT EXISTS channel_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_connection_id UUID NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  subscribers_gained INT NOT NULL DEFAULT 0,
  subscribers_lost INT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_connection_id, date)
);

-- Video-level daily metrics
CREATE TABLE IF NOT EXISTS video_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id, date)
);

-- Metric anomalies (spikes/dips)
CREATE TABLE IF NOT EXISTS metric_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_connection_id UUID NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  z_score NUMERIC NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('spike', 'dip')),
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API response cache
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI insights cache
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, context_hash, insight_type)
);

-- AI usage tracking (rate limits)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tips_count INT NOT NULL DEFAULT 0,
  optimize_count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- Competitors
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
  youtube_channel_id TEXT NOT NULL,
  nickname TEXT,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_connection_id, youtube_channel_id)
);

-- Competitor video snapshots
CREATE TABLE IF NOT EXISTS competitor_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competitor_id, youtube_video_id)
);

-- Inspiration pipeline nodes
CREATE TABLE IF NOT EXISTS pipeline_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('external_video', 'competitor_video', 'note', 'draft', 'published_video')),
  title TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,
  notes TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline edges
CREATE TABLE IF NOT EXISTS pipeline_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES pipeline_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('inspired_by', 'referenced', 'response_to', 'remix_of')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_metrics_daily_channel_date ON channel_metrics_daily(channel_connection_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(channel_connection_id);
CREATE INDEX IF NOT EXISTS idx_metric_anomalies_channel ON metric_anomalies(channel_connection_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_hash ON ai_insights(context_hash);
CREATE INDEX IF NOT EXISTS idx_pipeline_nodes_user ON pipeline_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_channel ON competitors(channel_connection_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_edges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Google accounts policies
CREATE POLICY google_accounts_all ON google_accounts FOR ALL USING (auth.uid() = user_id);

-- Channel connections policies
CREATE POLICY channel_connections_all ON channel_connections FOR ALL USING (auth.uid() = user_id);

-- Videos policies (via channel ownership)
CREATE POLICY videos_all ON videos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM channel_connections cc WHERE cc.id = videos.channel_connection_id AND cc.user_id = auth.uid()
  ));

-- Channel metrics policies
CREATE POLICY channel_metrics_all ON channel_metrics_daily FOR ALL
  USING (EXISTS (
    SELECT 1 FROM channel_connections cc WHERE cc.id = channel_metrics_daily.channel_connection_id AND cc.user_id = auth.uid()
  ));

-- Video metrics policies
CREATE POLICY video_metrics_all ON video_metrics_daily FOR ALL
  USING (EXISTS (
    SELECT 1 FROM videos v
    JOIN channel_connections cc ON cc.id = v.channel_connection_id
    WHERE v.id = video_metrics_daily.video_id AND cc.user_id = auth.uid()
  ));

-- Metric anomalies policies
CREATE POLICY metric_anomalies_all ON metric_anomalies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM channel_connections cc WHERE cc.id = metric_anomalies.channel_connection_id AND cc.user_id = auth.uid()
  ));

-- AI insights policies
CREATE POLICY ai_insights_all ON ai_insights FOR ALL USING (auth.uid() = user_id);

-- AI usage policies
CREATE POLICY ai_usage_all ON ai_usage FOR ALL USING (auth.uid() = user_id);

-- Competitors policies
CREATE POLICY competitors_all ON competitors FOR ALL USING (auth.uid() = user_id);

-- Competitor videos policies
CREATE POLICY competitor_videos_all ON competitor_videos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM competitors c WHERE c.id = competitor_videos.competitor_id AND c.user_id = auth.uid()
  ));

-- Pipeline policies
CREATE POLICY pipeline_nodes_all ON pipeline_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY pipeline_edges_all ON pipeline_edges FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
