-- Checkout update v2: Backfill last-day order_items using SKUs provided
-- Idempotent: inserts only where an order has zero items.

BEGIN;

-- Parameters
-- Adjust the window if needed (defaults to last 24 hours)
WITH params AS (
  SELECT (NOW() - INTERVAL '1 day')::timestamptz AS since
),
-- Candidate orders in the past day that currently have no items
orders_needing_items AS (
  SELECT o.order_id, o.subtotal_cents, o.created_at
  FROM public.orders o
  CROSS JOIN params p
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS item_count
    FROM public.order_items oi
    WHERE oi.order_id = o.order_id
  ) x ON TRUE
  WHERE o.created_at >= p.since
    AND COALESCE(x.item_count, 0) = 0
),
-- Decide a SKU for each order based on subtotal, per requested rules
-- Use a LATERAL subselect to choose a random default SKU when not 500/700
picked AS (
  SELECT
    o.order_id,
    o.subtotal_cents,
    CASE
      WHEN o.subtotal_cents = 500 THEN 'BOT-004'   -- Google Cloud Bottle
      WHEN o.subtotal_cents = 700 THEN 'CAP-001'   -- Headwear Cap
      ELSE r.sku
    END AS sku
  FROM orders_needing_items o
  CROSS JOIN LATERAL (
    SELECT sku
    FROM (VALUES ('BUL-002'), ('PEN-003'), ('SUN-005')) AS v(sku)
    ORDER BY RANDOM()
    LIMIT 1
  ) r
)
-- Insert a single line item per order matching the order subtotal
INSERT INTO public.order_items (order_id, sku, qty, price_cents)
SELECT
  p.order_id,
  p.sku,
  1 AS qty,
  p.subtotal_cents AS price_cents
FROM picked p;

COMMIT;

-- Notes
-- - This script only fabricates items for orders in the last 24 hours that have zero items.
-- - Subtotal 500 -> BOT-004 (Google Cloud Bottle); 700 -> CAP-001 (Headwear Cap).
-- - All other subtotals get a single line item chosen from BUL-002, PEN-003, SUN-005.
-- - Future orders will be populated for real by the application checkout flow.
