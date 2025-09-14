-- Checkout update: ensure orders capture gross totals and discount tracking
-- This script is idempotent and safe to run multiple times.

BEGIN;

-- 1) Ensure discount fields exist on orders (idempotent)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label TEXT;

-- 2) Helpful index for discount queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_orders_discount_cents ON public.orders(discount_cents);

-- 3) Backfill historical data where discounted orders wrote total_cents as 0
--    Set total_cents to the gross amount (subtotal + tax) and mark them as paid.
UPDATE public.orders
SET total_cents = (subtotal_cents + tax_cents)
WHERE total_cents = 0
  AND (subtotal_cents + tax_cents) > 0;

-- Mark discounted orders as paid (keeps non-discounted statuses untouched)
UPDATE public.orders
SET status = 'paid'
WHERE discount_cents > 0
  AND status <> 'paid';

COMMIT;

-- Notes
-- - New orders created by the app now always persist gross totals:
--   total_cents = subtotal_cents + tax_cents, with discounts tracked separately.
-- - This script ensures existing zero-total discounted orders are corrected and shown as paid.

