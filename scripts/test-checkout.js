/*
  Simulate a checkout and verify Supabase is updated.
  Uses the same schema as the app’s createOrder.
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const merchantId = process.env.MERCHANT_ID || process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Pick a product to order
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .single();

  if (prodErr || !product) {
    throw new Error(`No product found to test checkout. Error: ${prodErr ? prodErr.message : 'none'}`);
  }

  const quantity = 1;
  const subtotal = product.price_cents * quantity;
  const tax = Math.round(subtotal * 0.13);
  const totalBeforeDiscount = subtotal + tax;

  // Insert order (zero total, 100% discount)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      merchant_id: merchantId,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: 0,
      status: 'confirmed_demo',
      discount_cents: totalBeforeDiscount,
      discount_label: 'Hack The North Developer Discount'
    })
    .select()
    .single();

  if (orderErr || !order) {
    throw new Error(`Failed to create order: ${orderErr ? orderErr.message : 'unknown error'}`);
  }

  // Insert order_items
  const { error: itemsErr } = await supabase
    .from('order_items')
    .insert([
      {
        order_id: order.order_id,
        sku: product.sku,
        qty: quantity,
        price_cents: product.price_cents
      }
    ]);

  if (itemsErr) {
    throw new Error(`Failed to create order items: ${itemsErr.message}`);
  }

  // Verify order values
  if (order.total_cents !== 0 || order.discount_cents !== totalBeforeDiscount) {
    throw new Error('Order amounts did not match expected zero-total with full discount.');
  }

  console.log('OK: Created discounted order');
  console.log(`Order ID: ${order.order_id}`);
  console.log(`Subtotal: ${subtotal} | Tax: ${tax} | Discount: ${totalBeforeDiscount} | Total: 0`);
}

main().catch((e) => {
  console.error('Test checkout failed:', e.message || e);
  process.exit(1);
});

