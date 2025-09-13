-- Add Shopify integration fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shopify_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_handle TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update product_id to be text to support Shopify IDs
ALTER TABLE products 
ALTER COLUMN product_id TYPE TEXT USING product_id::TEXT;

-- Create index for Shopify lookups
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_handle ON products(shopify_handle);
