-- Create site_settings table for storing global site configuration
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if they don't exist
INSERT INTO site_settings (setting_key, setting_value) VALUES 
    ('site_name', 'Gemsutopia'),
    ('site_favicon', '/favicon.ico'),
    ('site_tagline', 'Discover the beauty of natural gemstones'),
    ('seo_title', 'Gemsutopia - Premium Gemstone Collection'),
    ('seo_description', 'Hi, I''m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...'),
    ('seo_keywords', 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing'),
    ('seo_author', 'Gemsutopia')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE site_settings_id_seq TO your_app_user;