import { createClient } from '@supabase/supabase-js';
import type { Product, Order, OrderItem, MinlpRun } from '../packages/shared/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for server operations (if needed)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Product operations
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  // First try local Supabase lookup
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (data) {
    return data;
  }

  // If not found, trigger sync and try again
  if (error?.code === 'PGRST116') {
    console.log('Product not found locally, syncing from Shopify...');
    
    // Trigger sync
    await fetch('/api/sync-products', { method: 'POST' });
    
    // Try again after sync
    const { data: retryData } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();
    
    return retryData || null;
  }

  return null;
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

// Find a product by exact name (case-insensitive)
export async function getProductByName(name: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product by name:', error);
    return null;
  }

  return data ?? null;
}

// Order operations
export async function createOrder(
  merchantId: string,
  items: Array<{ sku: string; qty: number; price_cents: number }>,
  subtotal: number,
  tax: number,
  total: number,
  discountLabel?: string,
  discountCents?: number
): Promise<Order | null> {
  // Start a Supabase transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      merchant_id: merchantId,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: total,
      status: 'confirmed_demo',
      // New discount fields (requires DB migration)
      discount_cents: typeof discountCents === 'number' ? discountCents : 0,
      discount_label: discountLabel ?? null
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return null;
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.order_id,
    sku: item.sku,
    qty: item.qty,
    price_cents: item.price_cents
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    return null;
  }

  return order;
}

export async function getOrders(merchantId?: string): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (merchantId) {
    query = query.eq('merchant_id', merchantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching order items:', error);
    return [];
  }

  return data || [];
}

// MINLP operations
export async function createMinlpRun(
  merchantId: string,
  orderId: string | null,
  inputJson: any,
  solutionJson?: any,
  rationaleText?: string
): Promise<MinlpRun | null> {
  const { data, error } = await supabase
    .from('minlp_runs')
    .insert({
      merchant_id: merchantId,
      order_id: orderId,
      input_json: inputJson,
      solution_json: solutionJson,
      rationale_text: rationaleText
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating MINLP run:', error);
    return null;
  }

  return data;
}

export async function getLatestMinlpRun(merchantId: string): Promise<MinlpRun | null> {
  const { data, error } = await supabase
    .from('minlp_runs')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // If there are no rows yet, data will be null and error will be undefined with maybeSingle()
  if (error) {
    console.error('Error fetching latest MINLP run:', error);
    return null;
  }

  return data;
}

// Realtime subscriptions
export function subscribeToOrders(
  merchantId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`orders:${merchantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `merchant_id=eq.${merchantId}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToMinlpRuns(
  merchantId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`minlp_runs:${merchantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'minlp_runs',
        filter: `merchant_id=eq.${merchantId}`
      },
      callback
    )
    .subscribe();
}

// ========= Catalog helpers =========
export type CatalogItem = {
  sku: string;
  merchant_id: string;
  name: string;
  supplier?: string | null;
  country?: string | null;
  case_pack?: number | null;
  moq?: number | null;
  sales?: number | null;
  demand52?: number[] | null;
  forecasted_demand?: number[] | null;
  expiration?: string | null;
};

export async function getCatalogItems(merchantId: string): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('name', { ascending: true });
  if (error) {
    console.error('getCatalogItems error:', error);
    return [];
  }
  return (data as CatalogItem[]) || [];
}

export async function upsertCatalogItems(items: Omit<CatalogItem, 'merchant_id'>[], merchantId: string): Promise<boolean> {
  if (!items?.length) return true;
  const payload = items.map((it) => ({ ...it, merchant_id: merchantId }));
  const client = supabaseServiceKey ? (supabaseAdmin as typeof supabase) : supabase;
  const { error } = await client.from('catalog_items').upsert(payload, { onConflict: 'sku' });
  if (error) {
    console.error('upsertCatalogItems error:', error);
    return false;
  }
  return true;
}

export async function deleteCatalogItem(sku: string, merchantId: string): Promise<boolean> {
  const client = supabaseServiceKey ? (supabaseAdmin as typeof supabase) : supabase;
  const { error } = await client.from('catalog_items').delete().match({ sku, merchant_id: merchantId });
  if (error) {
    console.error('deleteCatalogItem error:', error);
    return false;
  }
  return true;
}

export async function updateForecastForSkus(forecasts: Record<string, number[]>, merchantId: string): Promise<number> {
  const entries = Object.entries(forecasts);
  if (!entries.length) return 0;
  const client = supabaseServiceKey ? (supabaseAdmin as typeof supabase) : supabase;
  let updated = 0;
  for (const [sku, arr] of entries) {
    const { error } = await client
      .from('catalog_items')
      .update({ forecasted_demand: arr })
      .match({ sku, merchant_id: merchantId });
    if (error) {
      console.error('updateForecastForSkus error:', error);
      continue;
    }
    updated += 1;
  }
  return updated;
}

// Record audit entries for adjustments
export async function recordAdjustmentEntries(entries: Array<{
  merchant_id: string;
  sku: string;
  provider?: string;
  prompt?: string;
  weights?: number[] | null;
  factor?: number | null;
  score?: number | null;
}>): Promise<boolean> {
  if (!entries?.length) return true;
  const client = supabaseServiceKey ? (supabaseAdmin as typeof supabase) : supabase;
  const payload = entries.map((e) => ({
    merchant_id: e.merchant_id,
    sku: e.sku,
    provider: e.provider ?? null,
    prompt: e.prompt ?? null,
    weights: Array.isArray(e.weights) ? e.weights : null,
    factor: typeof e.factor === 'number' ? e.factor : null,
    score: typeof e.score === 'number' ? e.score : null,
  }));
  const { error } = await client.from('catalog_adjustments').insert(payload);
  if (error) {
    console.error('recordAdjustmentEntries error:', error);
    return false;
  }
  return true;
}

// ========= Inventory & Sales helpers =========
export async function getInventoryForMerchant(merchantId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('sku,name,price_cents,inventory_quantity,updated_at,category')
    .eq('merchant_id', merchantId)
    .order('name');
  if (error) {
    console.warn('getInventoryForMerchant error:', error);
    return [];
  }
  return (data || []).map((p: any, idx: number) => ({
    id: String(idx + 1),
    name: p.name,
    sku: p.sku,
    category: p.category ?? null,
    available_quantity: p.inventory_quantity ?? 0,
    warehouse_quantity: p.inventory_quantity ?? 0,
    reserved_quantity: 0,
    selling_price: typeof p.price_cents === 'number' ? p.price_cents / 100 : null,
  }));
}

export async function getSalesTransactions(merchantId: string) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('id,order_id,sku,qty,price_cents,orders!inner(created_at,merchant_id,status)')
    .eq('orders.merchant_id', merchantId)
    .order('orders.created_at', { ascending: false });
  if (error) {
    console.warn('getSalesTransactions error:', error);
    return [];
  }
  const skus = Array.from(new Set((items || []).map((it: any) => it.sku)));
  const nameBySku: Record<string, string> = {};
  if (skus.length) {
    const { data: prods } = await supabase
      .from('products')
      .select('sku,name')
      .in('sku', skus)
      .eq('merchant_id', merchantId);
    (prods || []).forEach((p: any) => (nameBySku[p.sku] = p.name));
  }
  return (items || []).map((it: any) => ({
    id: it.id,
    product_id: it.sku,
    product_name: nameBySku[it.sku] || it.sku,
    quantity: it.qty,
    unit_price: (it.price_cents || 0) / 100,
    total_amount: ((it.price_cents || 0) * (it.qty || 0)) / 100,
    sale_date: (it.orders?.created_at || '').slice(0, 10),
    customer_id: 'N/A',
    status: it.orders?.status || 'completed',
  }));
}
