CREATE TABLE featured_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  card_color VARCHAR(7),
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  product_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_featured_products_active ON featured_products(is_active);
CREATE INDEX idx_featured_products_sort_order ON featured_products(sort_order);
CREATE INDEX idx_featured_products_product_id ON featured_products(product_id);

CREATE OR REPLACE FUNCTION update_featured_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_featured_products_updated_at 
  BEFORE UPDATE ON featured_products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_featured_products_updated_at();

ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage featured products" ON featured_products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read active featured products" ON featured_products
  FOR SELECT USING (is_active = true);

INSERT INTO featured_products (name, type, description, image_url, price, original_price, product_id, sort_order) VALUES
('Alberta Sapphire', 'sapphire', 'Hand-mined sapphire from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review1.jpg', 299.00, 399.00, 1, 1),
('Canadian Peridot', 'peridot', 'Hand-mined peridot from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review2.jpg', 199.00, 249.00, 2, 2),
('Ammolite Gem', 'ammolite', 'Hand-mined ammolite from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review3.jpg', 459.00, 599.00, 3, 3),
('Blue Jay Sapphire', 'sapphire', 'Hand-mined sapphire from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review4.jpg', 349.00, 449.00, 4, 4),
('Alberta Garnet', 'garnet', 'Hand-mined garnet from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review5.jpg', 179.00, 229.00, 5, 5),
('Canadian Quartz', 'quartz', 'Hand-mined quartz from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review6.jpg', 129.00, 169.00, 6, 6),
('Prairie Agate', 'agate', 'Hand-mined agate from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review7.jpg', 89.00, 119.00, 7, 7),
('Rocky Mountain Jasper', 'jasper', 'Hand-mined jasper from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review8.jpg', 99.00, 129.00, 8, 8),
('Alberta Amethyst', 'amethyst', 'Hand-mined amethyst from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review9.jpg', 219.00, 289.00, 9, 9),
('Canadian Topaz', 'topaz', 'Hand-mined topaz from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review10.jpg', 259.00, 329.00, 10, 10),
('Northern Opal', 'opal', 'Hand-mined opal from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review12.jpg', 389.00, 519.00, 11, 11),
('Foothills Tourmaline', 'tourmaline', 'Hand-mined tourmaline from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review13.jpg', 299.00, 399.00, 12, 12),
('Prairie Moonstone', 'moonstone', 'Hand-mined moonstone from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review14.jpg', 169.00, 219.00, 13, 13),
('Canadian Labradorite', 'labradorite', 'Hand-mined labradorite from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/8680a65c-0c82-4529-a8f2-a051344e565a.webp', 149.00, 199.00, 14, 14),
('Alberta Citrine', 'citrine', 'Hand-mined citrine from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/c07009ff-cd86-45d0-858e-441993683280.webp', 139.00, 179.00, 15, 15),
('Mountain Jade', 'jade', 'Hand-mined jade from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.', '/images/Review-5.jpg', 229.00, 299.00, 16, 16);

COMMENT ON TABLE featured_products IS 'Table for managing featured products in the featured section with editable content';