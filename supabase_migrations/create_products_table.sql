-- Create products table for Gemsutopia
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    inventory INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    weight DECIMAL(8,3),
    dimensions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale) WHERE on_sale = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Generate SKU if not provided
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        -- Generate SKU based on category and timestamp
        NEW.sku := UPPER(SUBSTRING(NEW.category FROM 1 FOR 3)) || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-generate SKU
CREATE TRIGGER generate_products_sku
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_sku();

-- Insert some sample products to test (you can remove these later)
INSERT INTO products (name, description, price, sale_price, on_sale, category, images, tags, inventory, featured, is_active, metadata) VALUES
('Alberta Sapphire', 'Hand-mined sapphire from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.', 299.00, 199.00, true, 'sapphire', ARRAY['/images/Review1.jpg'], ARRAY['sapphire', 'blue', 'alberta', 'canadian'], 5, true, true, '{"origin": "Alberta, Canada", "gem_type": "sapphire", "cut": "oval", "carat": 2.5, "clarity": "VVS1", "color": "blue"}'),
('Canadian Peridot', 'Hand-mined peridot from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.', 199.00, null, false, 'peridot', ARRAY['/images/Review2.jpg'], ARRAY['peridot', 'green', 'alberta', 'canadian'], 8, true, true, '{"origin": "Alberta, Canada", "gem_type": "peridot", "cut": "round", "carat": 1.8, "clarity": "VS1", "color": "green"}'),
('Ammolite Gem', 'Hand-mined ammolite from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.', 459.00, 399.00, true, 'ammolite', ARRAY['/images/Review3.jpg'], ARRAY['ammolite', 'rainbow', 'alberta', 'canadian', 'rare'], 3, true, true, '{"origin": "Alberta, Canada", "gem_type": "ammolite", "cut": "cabochon", "carat": 3.2, "clarity": "AAA", "color": "rainbow"}');