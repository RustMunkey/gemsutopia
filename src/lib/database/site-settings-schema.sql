-- Site Settings Table Schema
-- Run this SQL in your Supabase dashboard to create the site_settings table

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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at column
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings (will not overwrite existing values)
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

-- Grant necessary permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE site_settings_id_seq TO your_app_user;

-- Verify table creation
SELECT 'Site settings table created successfully!' as status;