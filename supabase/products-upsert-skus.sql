-- Canonicalize SKUs across Supabase products for a consistent checkout experience.
-- Idempotent upsert + optional name-based normalization.

BEGIN;

-- Set your merchant UUID here if different
DO $$
DECLARE
  m_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
  -- Ensure canonical rows exist (upsert by unique sku)
  INSERT INTO public.products (product_id, merchant_id, sku, name, price_cents, barcode, created_at)
  VALUES
    (gen_random_uuid()::text, m_id, 'BOT-004', 'Google Cloud Bottle',               500,  '9990000000004', NOW()),
    (gen_random_uuid()::text, m_id, 'CAP-001', 'Headwear Cap',                      700,  '9990000000001', NOW()),
    (gen_random_uuid()::text, m_id, 'BUL-002', 'RedBull Energy Drink Original',     299,  '9990000000002', NOW()),
    (gen_random_uuid()::text, m_id, 'PEN-003', 'Ballpoint Pen',                     199,  '9990000000003', NOW()),
    (gen_random_uuid()::text, m_id, 'SUN-005', 'Sun Life Socks',                    999,  '9990000000005', NOW())
  ON CONFLICT (sku) DO UPDATE
    SET name = EXCLUDED.name,
        price_cents = EXCLUDED.price_cents,
        merchant_id = EXCLUDED.merchant_id
    WHERE products.merchant_id = m_id;

  -- Optional: try to align existing products by name → canonical SKU
  -- Only update when names clearly match and SKU differs; ignore conflicts automatically
  UPDATE public.products SET sku = 'BOT-004'
    WHERE merchant_id = m_id AND LOWER(name) LIKE '%google cloud bottle%'
      AND sku <> 'BOT-004';

  UPDATE public.products SET sku = 'CAP-001'
    WHERE merchant_id = m_id AND LOWER(name) LIKE '%headwear cap%'
      AND sku <> 'CAP-001';

  UPDATE public.products SET sku = 'BUL-002'
    WHERE merchant_id = m_id AND LOWER(name) LIKE '%redbull energy drink original%'
      AND sku <> 'BUL-002';

  UPDATE public.products SET sku = 'PEN-003'
    WHERE merchant_id = m_id AND LOWER(name) LIKE '%ballpoint pen%'
      AND sku <> 'PEN-003';

  UPDATE public.products SET sku = 'SUN-005'
    WHERE merchant_id = m_id AND LOWER(name) LIKE '%sun life socks%'
      AND sku <> 'SUN-005';
END $$;

COMMIT;

-- Notes
-- - Keeps canonical SKUs aligned in Supabase: BOT-004, CAP-001, BUL-002, PEN-003, SUN-005.
-- - If Shopify variants use the same SKUs, running /api/sync-products will preserve alignment.
-- - If Shopify SKUs differ, consider updating them in Shopify, then POST /api/sync-products again.

