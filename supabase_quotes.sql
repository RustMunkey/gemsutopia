CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author VARCHAR(255),
  gem_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_active ON quotes(is_active);
CREATE INDEX idx_quotes_sort_order ON quotes(sort_order);

CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON quotes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_quotes_updated_at();

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage quotes" ON quotes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read active quotes" ON quotes
  FOR SELECT USING (is_active = true);

INSERT INTO quotes (quote, author, gem_type, sort_order) VALUES
('The Earth does not belong to us; we belong to the Earth. All things are connected like the blood that unites one family.', 'Chief Seattle', 'General', 1),
('Like a diamond in the rough, true beauty and strength often lie hidden beneath the surface, waiting to be revealed.', 'Unknown', 'Diamond', 2),
('Emeralds teach us that the most precious things in life take time to form, just as wisdom comes with patience and experience.', 'Ancient Proverb', 'Emerald', 3),
('The ruby reminds us that passion, like fire, can illuminate the darkest paths and warm the coldest hearts.', 'Persian Saying', 'Ruby', 4),
('Sapphires hold the wisdom of the ages, reflecting that true knowledge comes not from what we know, but from understanding what we do not.', 'Unknown', 'Sapphire', 5),
('Like the pearl formed through adversity, our greatest treasures often come from our most challenging moments.', 'Unknown', 'Pearl', 6);

COMMENT ON TABLE quotes IS 'Table for storing philosophical quotes about gemstones';