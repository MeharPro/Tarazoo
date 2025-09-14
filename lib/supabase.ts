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
  const norm = name.trim().toLowerCase();
  const variants = Array.from(new Set([
    norm,
    norm.replace(/\s+/g, ' '),
    norm.replace(/redbull/g, 'red bull'),
    norm.replace(/red bull/g, 'redbull'),
    norm.replace(/water bottle/g, 'bottle'),
  ]));

  // 1) Try exact (case-insensitive)
  for (const v of variants) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('name', v)
      .maybeSingle();
    if (data) return data;
  }

  // 2) Try substring match
  for (const v of variants) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${v}%`)
      .maybeSingle();
    if (data) return data;
  }

  // 3) Try word-wise contains order
  const words = norm.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const pattern = `%${words.join('%')}%`;
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('name', pattern)
      .maybeSingle();
    if (data) return data;
  }

  return null;
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
  // Always persist pre-discount total to Supabase
  const preDiscountTotal = Math.max(0, Math.round(Number(subtotal) + Number(tax)));
  // Start a Supabase transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      merchant_id: merchantId,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: preDiscountTotal,
      status: 'paid',
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
