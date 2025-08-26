CREATE TABLE IF NOT EXISTS discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    free_shipping BOOLEAN DEFAULT FALSE,
    minimum_order DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires ON discount_codes(expires_at);

CREATE OR REPLACE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS discount_code_usage (
    id SERIAL PRIMARY KEY,
    discount_code_id INTEGER REFERENCES discount_codes(id) ON DELETE CASCADE,
    order_id VARCHAR(100),
    customer_email VARCHAR(255),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code_id ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order_id ON discount_code_usage(order_id);

INSERT INTO discount_codes (code, description, discount_type, discount_value, free_shipping, minimum_order, usage_limit) VALUES 
    ('WELCOME10', 'Welcome discount for new customers', 'percentage', 10.00, false, 0, 100),
    ('FREESHIP50', 'Free shipping on orders over $50', 'percentage', 0, true, 50.00, null),
    ('SAVE20', '20% off any order', 'percentage', 20.00, false, 0, null)
ON CONFLICT (code) DO NOTHING;

SELECT 'Discount codes table created successfully!' as status;