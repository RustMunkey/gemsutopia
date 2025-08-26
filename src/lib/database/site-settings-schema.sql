CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO site_settings (setting_key, setting_value) VALUES 
    ('site_name', 'Gemsutopia'),
    ('site_favicon', '/favicon.ico'),
    ('site_tagline', 'Discover the beauty of natural gemstones'),
    ('seo_title', 'Gemsutopia - Premium Gemstone Collection'),
    ('seo_description', 'Hi, I''m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...'),
    ('seo_keywords', 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing'),
    ('seo_author', 'Gemsutopia'),
    ('open_graph_title', ''),
    ('open_graph_description', ''),
    ('open_graph_image', ''),
    ('twitter_title', ''),
    ('twitter_description', ''),
    ('twitter_image', '')
ON CONFLICT (setting_key) DO NOTHING;

SELECT 'Site settings table created successfully!' as status;