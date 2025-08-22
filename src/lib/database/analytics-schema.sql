-- Analytics Events Table Schema for Supabase
-- This table stores all analytics events for custom tracking

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  screen_resolution VARCHAR(50),
  viewport_size VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_data JSONB DEFAULT '{}',
  is_test_session BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_is_test_session ON analytics_events(is_test_session);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url ON analytics_events(page_url);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for service role)
CREATE POLICY "Enable all operations for service role" ON analytics_events
  FOR ALL USING (true);