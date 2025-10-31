-- IMDB Data Pipeline Schema
-- Migration for enhanced actor and content tracking with IMDB integration

-- Enhanced actors table with IMDB-specific fields
ALTER TABLE actors
ADD COLUMN IF NOT EXISTS imdb_url TEXT,
ADD COLUMN IF NOT EXISTS known_for_titles TEXT[],
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS filmography_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS birth_place VARCHAR(255),
ADD COLUMN IF NOT EXISTS height_inches INTEGER,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Content table for movies, TV shows, etc.
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imdb_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  media_type VARCHAR(50) NOT NULL DEFAULT 'movie',
  genre VARCHAR(100)[],
  description TEXT,
  duration_minutes INTEGER,
  rating DECIMAL(2,1),
  poster_url TEXT,
  trailer_url TEXT,
  director VARCHAR(255)[],
  cast_actors VARCHAR(255)[],
  release_date DATE,
  language VARCHAR(10)[],
  country VARCHAR(100)[],
  awards JSONB DEFAULT '{}',
  box_office BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Actor-content relationships (many-to-many)
CREATE TABLE IF NOT EXISTS actor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  role_name VARCHAR(255),
  character_name VARCHAR(255),
  is_main_cast BOOLEAN DEFAULT false,
  order_in_credits INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(actor_id, content_id)
);

-- IMDB sync log for tracking data freshness
CREATE TABLE IF NOT EXISTS imdb_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL, -- 'actor', 'content', 'full_sync'
  entity_type VARCHAR(50), -- 'actor' or 'content'
  entity_id UUID,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Cache table for frequently accessed data
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(500) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL, -- 'api_response_time', 'cache_hit_rate', etc.
  endpoint VARCHAR(255),
  value DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) DEFAULT 'ms',
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_actors_imdb_id_enhanced ON actors(imdb_id) WHERE imdb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actors_name_search ON actors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_actors_last_synced ON actors(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_actors_filmography_count ON actors(filmography_count DESC);

CREATE INDEX IF NOT EXISTS idx_content_imdb_id ON content(imdb_id);
CREATE INDEX IF NOT EXISTS idx_content_title_search ON content USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_content_year ON content(year DESC);
CREATE INDEX IF NOT EXISTS idx_content_media_type ON content(media_type);
CREATE INDEX IF NOT EXISTS idx_content_release_date ON content(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_last_synced ON content(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_actor_content_actor_id ON actor_content(actor_id);
CREATE INDEX IF NOT EXISTS idx_actor_content_content_id ON actor_content(content_id);
CREATE INDEX IF NOT EXISTS idx_actor_content_role ON actor_content(role_name);

CREATE INDEX IF NOT EXISTS idx_imdb_sync_log_type ON imdb_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_imdb_sync_log_status ON imdb_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_imdb_sync_log_started_at ON imdb_sync_log(sync_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_created_at ON cache_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Performance metrics aggregation function
CREATE OR REPLACE FUNCTION get_performance_summary(
  metric_type_param VARCHAR(50),
  time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  avg_value DECIMAL(10,3),
  min_value DECIMAL(10,3),
  max_value DECIMAL(10,3),
  count_samples BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as count_samples
  FROM performance_metrics
  WHERE metric_type = metric_type_param
    AND recorded_at > NOW() - (time_window_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;