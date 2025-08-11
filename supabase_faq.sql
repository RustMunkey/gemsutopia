CREATE TABLE faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_active ON faq(is_active);
CREATE INDEX idx_faq_sort_order ON faq(sort_order);

CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faq_updated_at 
  BEFORE UPDATE ON faq 
  FOR EACH ROW 
  EXECUTE FUNCTION update_faq_updated_at();

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage faq" ON faq
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read active faq" ON faq
  FOR SELECT USING (is_active = true);

INSERT INTO faq (question, answer, sort_order) VALUES
('How do I know if a gemstone is authentic?', 'All our gemstones come with certificates of authenticity. We hand-select each stone and many are personally mined by our founder. Each gemstone undergoes professional verification to ensure quality and authenticity.', 1),
('What is your return policy?', 'We offer a 30-day return policy for all items. If you''re not completely satisfied with your purchase, you can return it for a full refund or exchange. Items must be in original condition with all packaging.', 2),
('Do you ship internationally?', 'Yes! We ship worldwide. Shipping costs and delivery times vary by location. All international orders are fully insured and tracked. Please note that customs duties may apply depending on your country.', 3),
('How should I care for my gemstones?', 'Each gemstone has different care requirements. Generally, store them separately to avoid scratching, clean with mild soap and water, and avoid harsh chemicals. We provide specific care instructions with each purchase.', 4),
('Can I see the actual stone before purchasing?', 'We provide high-quality photos and detailed descriptions for each stone. If you need additional photos or videos of a specific piece, please contact us and we''ll be happy to provide them.', 5),
('Do you offer custom jewelry settings?', 'Yes! We work with trusted jewelers to create custom settings for our gemstones. Contact us with your vision and we''ll help bring it to life with the perfect stone and setting combination.', 6);

COMMENT ON TABLE faq IS 'Table for storing frequently asked questions and answers';