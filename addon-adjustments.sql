-- Catalog adjustments audit log
-- Creates an append-only table to capture per-SKU adjustment events

create table if not exists public.catalog_adjustments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(merchant_id) on delete cascade,
  sku text not null references public.catalog_items(sku) on delete cascade,
  provider text,               -- 'cohere' | 'heuristic' | etc.
  prompt text,                 -- user instruction text
  weights jsonb,               -- [12] multipliers if provided
  factor numeric,              -- uniform factor if used
  score int,                   -- 0..100 Market Intuition Score snapshot
  created_at timestamptz default now()
);

create index if not exists catalog_adjustments_merchant_idx on public.catalog_adjustments(merchant_id);
create index if not exists catalog_adjustments_sku_idx on public.catalog_adjustments(sku);
create index if not exists catalog_adjustments_created_idx on public.catalog_adjustments(created_at desc);

