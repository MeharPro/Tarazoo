-- Add discount tracking for demo zero-dollar invoice
-- Run this in your Supabase SQL Editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label TEXT;

-- Optional: index for querying discounted orders
CREATE INDEX IF NOT EXISTS idx_orders_discount_cents ON orders(discount_cents);
