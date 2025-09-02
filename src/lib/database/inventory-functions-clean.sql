CREATE OR REPLACE FUNCTION decrement_inventory(
  product_id UUID,
  decrement_amount INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  new_inventory INTEGER,
  error_message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  current_inventory INTEGER;
  calculated_inventory INTEGER;
BEGIN
  SELECT inventory INTO current_inventory 
  FROM products 
  WHERE id = product_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Product not found'::TEXT;
    RETURN;
  END IF;
  
  calculated_inventory := current_inventory - decrement_amount;
  
  IF calculated_inventory < 0 THEN
    RETURN QUERY SELECT false, current_inventory, 'Insufficient inventory'::TEXT;
    RETURN;
  END IF;
  
  UPDATE products 
  SET inventory = calculated_inventory,
      updated_at = NOW()
  WHERE id = product_id;
  
  RETURN QUERY SELECT true, calculated_inventory, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION increment_inventory(
  product_id UUID,
  increment_amount INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  new_inventory INTEGER,
  error_message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  current_inventory INTEGER;
  calculated_inventory INTEGER;
BEGIN
  SELECT inventory INTO current_inventory 
  FROM products 
  WHERE id = product_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Product not found'::TEXT;
    RETURN;
  END IF;
  
  calculated_inventory := current_inventory + increment_amount;
  
  UPDATE products 
  SET inventory = calculated_inventory,
      updated_at = NOW()
  WHERE id = product_id;
  
  RETURN QUERY SELECT true, calculated_inventory, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION notify_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.inventory != NEW.inventory) THEN
    PERFORM pg_notify(
      'inventory_change',
      json_build_object(
        'product_id', NEW.id,
        'old_inventory', OLD.inventory,
        'new_inventory', NEW.inventory,
        'timestamp', extract(epoch from NOW())
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_change_trigger ON products;
CREATE TRIGGER inventory_change_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_inventory_change();