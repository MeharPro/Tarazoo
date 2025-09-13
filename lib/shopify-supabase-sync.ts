import { getProduct, getProducts } from './shopify';
import { supabase, supabaseAdmin } from './supabase';
import type { Product as ShopifyProduct } from './shopify/types';

const MERCHANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export interface SupabaseProduct {
  product_id: string;
  merchant_id: string;
  sku: string;
  name: string;
  price_cents: number;
  barcode: string;
  shopify_id: string;
  shopify_handle: string;
  image_url?: string;
  created_at?: string;
}

// Sync a single product by Shopify handle
export async function syncShopifyProductByHandle(handle: string) {
  try {
    const product = await getProduct(handle, { fresh: true });
    if (!product) {
      return { success: false, message: 'Product not found in Shopify' };
    }

    const supabaseProducts: SupabaseProduct[] = [];
    product.variants.forEach((variant, index) => {
      const shopifyBarcode = (variant as any).barcode;
      const supabaseProduct: SupabaseProduct = {
        product_id: `${product.id}-${variant.id}`,
        merchant_id: MERCHANT_ID,
        sku: (variant as any).sku || `SKU-${product.id}-${index}`,
        name: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
        price_cents: Math.round(parseFloat(variant.price.amount) * 100),
        barcode: shopifyBarcode || generateBarcode(product, index),
        shopify_id: product.id,
        shopify_handle: product.handle,
        image_url: product.featuredImage?.url
      };
      supabaseProducts.push(supabaseProduct);
    });

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('products')
      .upsert(supabaseProducts, { onConflict: 'product_id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error('Supabase sync (single) error:', error);
      return { success: false, error };
    }

    return { success: true, count: data?.length || 0, products: data };
  } catch (error) {
    console.error('Single product sync failed:', error);
    return { success: false, error };
  }
}

// Generate barcode from Shopify product ID or variant barcode
function generateBarcode(product: ShopifyProduct, variantIndex: number = 0): string {
  // Check if variant exists
  const variant = product.variants[variantIndex];
  
  // Generate deterministic barcode from product/variant ID
  const baseId = product.id.replace(/[^0-9]/g, '');
  const variantId = variant?.id.replace(/[^0-9]/g, '') || '0';
  
  // Create 13-digit barcode (EAN-13 format)
  const combined = (baseId + variantId).padStart(12, '0').slice(-12);
  return combined + calculateCheckDigit(combined);
}

// Calculate EAN-13 check digit
function calculateCheckDigit(code: string | undefined): string {
  if (!code) return '0';
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(code.charAt(i) || '0');
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return ((10 - (sum % 10)) % 10).toString();
}

export async function syncShopifyToSupabase() {
  try {
    console.log('🔄 Syncing Shopify products to Supabase...');
    
    // Fetch products from Shopify (fresh)
    const shopifyProducts = await getProducts({ fresh: true });
    
    if (!shopifyProducts || shopifyProducts.length === 0) {
      console.log('No products found in Shopify');
      return { success: false, message: 'No products in Shopify' };
    }
    
    // Transform Shopify products to Supabase format
    const supabaseProducts: SupabaseProduct[] = [];
    
    for (const product of shopifyProducts) {
      // Create a product entry for each variant
      product.variants.forEach((variant, index) => {
        // Check if variant has a barcode field (from Shopify inventory)
        const shopifyBarcode = (variant as any).barcode;
        
        const supabaseProduct: SupabaseProduct = {
          product_id: `${product.id}-${variant.id}`,
          merchant_id: MERCHANT_ID,
          sku: (variant as any).sku || `SKU-${product.id}-${index}`,
          name: variant.title === 'Default Title' 
            ? product.title 
            : `${product.title} - ${variant.title}`,
          price_cents: Math.round(parseFloat(variant.price.amount) * 100),
          barcode: shopifyBarcode || generateBarcode(product, index),
          shopify_id: product.id,
          shopify_handle: product.handle,
          image_url: product.featuredImage?.url
        };
        
        supabaseProducts.push(supabaseProduct);
      });
    }
    
    // Schema update will be done manually in Supabase dashboard
    
    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase;
    
    // Upsert products to Supabase
    const { data, error } = await client
      .from('products')
      .upsert(supabaseProducts, {
        onConflict: 'product_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Supabase sync error:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Synced ${data?.length || 0} products from Shopify to Supabase`);
    
    // Log sample products with barcodes
    if (data && data.length > 0) {
      console.log('\n📦 Sample synced products:');
      data.slice(0, 3).forEach(p => {
        console.log(`  - ${p.name}`);
        console.log(`    Barcode: ${p.barcode}`);
        console.log(`    Price: $${(p.price_cents / 100).toFixed(2)}`);
      });
    }
    
    return { 
      success: true, 
      count: data?.length || 0,
      products: data 
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error };
  }
}

export async function getProductByBarcodeOrShopify(barcode: string) {
  // First try to find by barcode
  const { data: barcodeMatch } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  
  if (barcodeMatch) {
    return barcodeMatch;
  }
  
  // If no barcode match, check if it's a Shopify product ID
  const { data: shopifyMatch } = await supabase
    .from('products')
    .select('*')
    .or(`shopify_id.eq.${barcode},product_id.eq.${barcode}`)
    .single();
  
  return shopifyMatch;
}
