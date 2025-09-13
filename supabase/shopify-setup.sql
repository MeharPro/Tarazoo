-- Update products table for Shopify integration
-- Run this in your Supabase SQL editor

-- First, modify the product_id column to support text (for Shopify IDs)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey CASCADE;
ALTER TABLE products ALTER COLUMN product_id TYPE TEXT USING product_id::TEXT;
ALTER TABLE products ADD PRIMARY KEY (product_id);

-- Add Shopify-specific columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shopify_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_handle TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_id);
CREATE INDEX IF NOT EXISTS idx_products_shopify_handle ON products(shopify_handle);

-- Clear old demo data (optional - comment out if you want to keep it)
-- DELETE FROM products WHERE merchant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Verify the schema update
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
