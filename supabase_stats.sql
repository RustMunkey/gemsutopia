CREATE TABLE stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  value VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  data_source VARCHAR(100),
  is_real_time BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stats_active ON stats(is_active);
CREATE INDEX idx_stats_sort_order ON stats(sort_order);
CREATE INDEX idx_stats_real_time ON stats(is_real_time);

CREATE OR REPLACE FUNCTION update_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stats_updated_at 
  BEFORE UPDATE ON stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_stats_updated_at();

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage stats" ON stats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read active stats" ON stats
  FOR SELECT USING (is_active = true);

INSERT INTO stats (title, value, description, icon, data_source, is_real_time, sort_order) VALUES
('Happy Customers', '1000+', 'Satisfied customers across Canada', 'users', 'manual', false, 1),
('Products Sold', '500+', 'Premium gemstones delivered', 'package', 'analytics', true, 2),
('Years of Experience', '10+', 'Expertise in gemstone sourcing', 'calendar', 'manual', false, 3),
('Five Star Reviews', '98%', 'Customer satisfaction rating', 'star', 'reviews', true, 4);

COMMENT ON TABLE stats IS 'Table for managing stats displayed in the about section with real-time analytics integration';