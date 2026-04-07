-- Add delivery_lat and delivery_lng columns to orders table if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);
